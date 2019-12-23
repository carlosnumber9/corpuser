import { Component, OnInit, ElementRef } from '@angular/core';
import * as d3 from 'd3';
import { Index } from '../../index.model';
import { Document } from '../../document.model';
import { HttpHeaders } from '@angular/common/http';
import { ElasticsearchService } from '../../elasticsearch.service';
import { faSync, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import { ActivatedRoute } from '@angular/router';

declare var $: any;

@Component({
    selector: 'app-stats',
    templateUrl: './stats.component.html',
    styleUrls: ['./stats.component.css']
})
export class StatsComponent implements OnInit {

    loaded: {
        dBar1;
        dBub1;
    };

    

    private FILTER_TYPES = {
        TOPIC: 'TOPIC',
        YEAR: 'YEAR'
    };

    faSync = faSync;
    faTimes = faTimesCircle;
    options: string[] = [];
    objectKeys = Object.keys;

    // indices : Lista de índices de Elasticsearch con el número de documentos de cada uno.
    indices: Index[] = [];
    host;
    svg;

    index: string;

    // lista : Lista de documentos añadidos para el índice.
    lista: Document[] = [];

    // listaH : Lista de temas del documento con su número de repeticiones
    listaH = [];

    // listaY : Lista de años de creación de los documentos con el número de documentos por año
    listaY = [];

    // corpusLimpio : Indica si todos los documentos del corpus tienen info de su fecha de creación
    corpusLimpio: boolean;

    // noLimpio : Número de documentos sin fecha de creación.
    noLimpios: number;

    // tSeleccionados : Lista de temas seleccionados para la interactividad del diagrama de burbujas
    tSeleccionados = [];

    // aSeleccionados : Lista de años seleccionados para la interactividad del diagrama de barras
    aSeleccionados = [];

    // nombres : Lista de los títulos de los documentos que componen el índice
    nombres = [];

    // idSel : Selección actual de ids de documentos para mostrar datos.
    idSel = [];

    idSelName = [];

    // body : Cuerpo de la petición en curso para mostrar datos.
    body = {
        'query': {},
        'aggs': {}
    };

    id: number;
    opciones = {
        headers: new HttpHeaders({
            'Content-Type': 'application/json'
        })
    };
    margin = { top: 20, right: 20, bottom: 30, left: 40 };
    private chartContainer: ElementRef = this.svg;
    color = 'primary';
    value = 50;
    mode = 'indeterminate';
    single: any[];
    multi: any[];
    view: any[] = [700, 400];

    // options
    showXAxis = true;
    showYAxis = true;
    gradient = false;
    showLegend = true;
    showXAxisLabel = true;
    xAxisLabel = 'Temas';
    showYAxisLabel = true;
    yAxisLabel = 'Importancia';

    colorScheme = {
        domain: ['#5AA454', '#A10A28', '#C7B42C', '#AAAAAA']
    };


    constructor(
        private elastic: ElasticsearchService,
        private route: ActivatedRoute
    ) {

        this.elastic = new ElasticsearchService();

        this.id = 1;
        this.loaded = {
            dBar1: false,
            dBub1: false
        };
        this.corpusLimpio = true;
        this.noLimpios = 0;
    }


    private onFilterSelection(filterType: string) {
        switch(filterType) {
            case this.FILTER_TYPES.TOPIC:
                this.updateBody();
                this.generateBarGraphData();
                break;
            case this.FILTER_TYPES.YEAR:
                this.updateBody();
                this.generateTopicsGraphData();
                 break;
            default:
                console.error('[StatsComponent] Incorrect filter type selection.');
                break;
        }
    }


    /**
     * Assigns to options array the list of all corpus terms
     */
    private async getTotalTermNameList() {

        this.options = [];
        let terminos = [];
        let ids = [];


        await this.elastic.search(this.index, this.body)
            .then(
                response => {
                    ids = response.hits.hits.map((elem) => (elem._id));
                },
                error => console.error(error)
            );


        // Realizamos una petición de multiterm vectors para obtener los temas.
        await this.elastic.getTermsList(this.index, 'attachment.content', ids).then(
            response => {

                let terms = {};
                response.docs.map((doc) => (Object.assign(terms, doc.term_vectors['attachment.content'].terms)));
                for (let key in terms) {
                    terminos.push({
                        'name': key,
                        'value': terms[key].ttf
                    });
                }

                terminos
                    .sort((elem1, elem2) => {
                        return (elem1['value'] > elem2['value']) ? -1 : 1;
                    });

                this.options = terminos.map(elem => elem['name']);

            }, (err) => {
                console.error('[StatsComponent] Error retrieving total term list');
                console.error(err);
            }
        );
    }


    /**
     * Assigns to nombres array the list of document titles matching current filters
     */
    getDocumentTitles() {

        let cuerpo = this.body;

        cuerpo['_source'] = ['title'];
        cuerpo['size'] = '10000';

        this.elastic.search(this.index, cuerpo).then(
            response => {

                let results = response.hits.hits;
                this.nombres = results.map((elem) => ({
                    id: elem['_id'],
                    name: elem['_source'].title
                }));

            }, error => console.error(error)
        );

    }

    ngOnInit() {

        this.index = this.route.snapshot.params.index;

        this.body.query = {
            bool: {
                must: [
                    {
                        match_all: {}
                    }
                ]
            }
        };

        this.getTotalTermNameList();

        this.loaded = {
            dBar1: false,
            dBub1: false
        };

        this.body = {
            'query': {
                'bool': {
                    'must': [
                        {
                            'match_all': {}
                        }
                    ]
                }
            },
            'aggs': {
                'dates': {
                    'date_histogram': {
                        'field': 'attachment.date',
                        'interval': 'year'
                    }
                }
            }
        };

        this.getDocumentTitles();

        //ACTUALIZAR LISTA DE DOCUMENTOS EN EL ÍNDICE
        this.lista = this.getTotalDocumentList();
        Object.assign(this.listaH);

        let htitle = $('#listtitle').outerHeight();
        let hinput = $('#nfilter').outerHeight();
        let maxcont = 550 - htitle - hinput;

        $('#lista').css('min-height', '580px');
        $('#contlista').css('height', +maxcont + 'px');
    }


    filtroNombre(event) {

        // let indice = this.idSel.indexOf(id);

        if (!this.idSelName.includes(event)) {
            this.idSelName.push(event);
        } else {
            this.idSelName.splice(this.idSelName.indexOf(event), 1);
        }

        this.updateBody();
        this.generateTopicsGraphData();
        this.generateBarGraphData();

        /*
            if(!this.idSelName.includes(id)) this.idSelName.push(id);
            else delete this.idSelName[this.idSelName.indexOf(id)];
            this.gen_bubbles();
            this.gen_dTemas();
        */
    }

    /**
     * Retrieves the total document list for the selected index
     */
    private getTotalDocumentList(): Document[] {
        const docRes: Document[] = [];
        this.elastic.getAllDocuments(this.index, 'doc')
            .then(response => {
                const totalDocumentList = response.hits.hits;
                for (const document of totalDocumentList) {
                    const docToInsert: Document = {
                        fecha: document._source.attachment.date,
                        contenido: document._source.attachment.content,
                        nombre: document._source.title,
                        npaginas: 0
                    };
                    docRes.push(docToInsert);
                }
                this.generateBarGraphData();
                this.generateTopicsGraphData();
            }, error => {
                console.error(error);
                console.error('[StatsComponent] There was an error trying to retrieve the total document list. (getTotalDocumentList)');
            });
        return docRes;
    }


    getHV() {

        let absString = '';

        let prepos = ['a', 'ante', 'bajo', 'cabe', 'con', 'contra', 'de', 'desde', 'en', 'entre', 'hacia', 'hasta', 'para', 'por', 'según', 'segun', 'sin', 'so', 'sobre', 'tras', 'durante', 'mediante'];
        let abc = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'ñ', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
        let dets = ['el', 'la', 'los', 'las', 'aquel', 'aquella', 'aquellas', 'aquellos', 'esa', 'esas', 'ese', 'esos', 'esta', 'estas', 'este', 'estos', 'mi', 'mis', 'tu', 'tus', 'su', 'sus', 'nuestra', 'nuestro', 'nuestras', 'nuestros', 'vuestra', 'vuestro', 'vuestras', 'vuestros', 'suya', 'suyo', 'suyas', 'suyos', 'cuanta', 'cuánta', 'cuántas', 'cuanto', 'cuánto', 'cuántos', 'que', 'qué', 'alguna', 'alguno', 'algunas', 'algunos', 'algun', 'algún', 'bastante', 'bastantes', 'cada', 'ninguna', 'ninguno', 'ningunas', 'ningunos', 'ningun', 'ningún', 'otra', 'otro', 'otras', 'otros', 'sendas', 'sendos', 'tanta', 'tanto', 'tantas', 'tantos', 'toda', 'todo', 'todas', 'todos', 'una', 'uno', 'unas', 'unos', 'un', 'varias', 'varios'];
        let random = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'es', 'al', 'sí', 'si', 'no', 'del', 'ti', 'lo', 'se', 'dos', 'va', 'ra', 'na', 've', 'da', 'me', 'ven', 'vi', 'av', 'll', 'iv', 'rv', 'ad', 'pa', 'le', 'aci', 'au', 'ct', 'lv', 'ha', 'pro', 'rc', 'ido', 'den', 'pt', 'nos', 'tal', 'eso', 'era', 'ser', 'más'];
        let adjs = ['rica'];
        let eng = ['or', 'co', 'on', 'ca', 'in', 'to', 'ac', 'rd', 'is', 'par', 'it', 'for', 'are', 'be', 'and'];

        for (let elem of this.lista) {
            absString = absString + elem.contenido;
        }

        let extract = absString;
        extract = extract.replace(/\(/g, '');
        extract = extract.replace(/\)/g, '');
        //extract = extract.replace(/(^\s*)|(\s*$)/gi, "");
        extract = extract.replace(/[ ]{2,}/gi, ' ');
        extract = extract.replace(/\n */g, '\n');
        extract = extract.replace(/-/g, '\n');
        extract = extract.replace(/,/g, '\n');
        extract = extract.replace(/\"/g, '\n');
        extract = extract.replace(/\./g, '\n');
        extract = extract.replace(/[*+=:¿?]/g, '\n');
        extract = extract.replace(/[1234567890]/g, '\n');
        extract = extract.replace(/\[/g, '\n');
        extract = extract.replace(/\]/g, '\n');
        extract = extract.replace(/\uF07E/ig, '\n');
        extract = extract.replace(/●/g, '\n');
        extract = extract.replace(/\n*/g, '');

        let palabras = extract.split(' ');

        for (let word of palabras) {
            let count = (extract.match(new RegExp(word, 'ig')) || []).length;
            let repetida = false;

            for (let p of this.listaH) {
                if (p.name.toUpperCase() === word.toUpperCase()) {
                    repetida = true;
                }
            }

            if (prepos.includes(word.toLowerCase())) {
                repetida = true;
            }
            if (abc.includes(word.toLowerCase())) {
                repetida = true;
            }
            if (word == '') {
                repetida = true;
            }
            if (dets.includes(word.toLowerCase())) {
                repetida = true;
            }
            if (random.includes(word.toLowerCase())) {
                repetida = true;
            }
            if (adjs.includes(word.toLowerCase())) {
                repetida = true;
            }
            if (eng.includes(word.toLowerCase())) {
                repetida = true;
            }


            if (!repetida) {
                this.listaH.push({
                    'name': word.toLowerCase(),
                    'value': count
                });
            }

            this.listaH.sort((elem1, elem2) => {
                return (elem1['value'] > elem2['value']) ? -1 : 1;
            });

            this.listaH = this.listaH.slice(0, 15);
        }
    }


    limpiarFiltros() {

        this.tSeleccionados = [];
        this.aSeleccionados = [];

        this.updateBody();

        this.generateTopicsGraphData();
        this.generateBarGraphData();

    }


    public async generateBarGraphData() {

        d3.select('#dbar').html('');
        //this.listaY = [];

        this.loaded['dBar1'] = false;

        // TODO: Recover rest variable utility with data service
        // let rest = 0;
        // Creamos body, el cuerpo de la petición para sacar los documentos por año.

        // Llamamos al método de búsqueda del servicio de ES y metemos la info en listaY.
        await this.elastic.search(this.index, this.body)
            .then(response => {

                this.listaY = response.aggregations.dates.buckets.map((elem) => ({
                    ano: new Date(elem.key_as_string).getFullYear(),
                    reps: elem.doc_count
                }));

                this.idSel = response.hits.hits.map((elem) => (elem._id));

                // rest = response.hits.total - d3.sum(this.listaY.map(e => e.reps));

            },
                error => {
                    console.error(error);
                });
    }


    /**
     * Updates topics list with current body object
     */
    public async generateTopicsGraphData() {

        d3.select('#dbub').html('');
        this.listaH = [];
        let ids = [];

        await this.elastic.search(this.index, this.body)
            .then(response => {
                this.idSel = response.hits.hits.map((elem) => elem._id);
                ids = (this.idSelName.length > 0) ? this.idSelName : this.idSel;
            }, error => console.error(error));

        // Realizamos una petición de multiterm vectors para obtener los temas.
        await this.elastic.getTermsList('testdocs', 'attachment.content', ids).then(
            response => {

                let terms = {};
                for (let doc of response.docs) {
                    Object.assign(terms, doc.term_vectors['attachment.content'].terms);
                }

                for (let key in terms) {
                    this.listaH.push({
                        'name': key,
                        'value': terms[key].ttf
                    });
                }

                this.listaH
                    .sort((elem1, elem2) => {
                        return (elem1['value'] > elem2['value']) ? -1 : 1;
                    });

                this.listaH = this.listaH.slice(0, 15);

            }, (err) => {
                console.error('[StatsComponent] Error trying to get term list for bubble chart.');
                console.error(err);
            }
        );
        
    }


    /**
     * Adds/Removes clicked topic to/from selected topics array and updates graphs
     * @param topic New topic to be added/removed from selected topics list
     */
    public addTopic(topic: string) {
        this.toggleFilter(this.tSeleccionados, topic);
        this.updateBody();
        this.generateBarGraphData();
    }


    /**
     * Adds filter to array if its not in, removes from array if it does
     */
    private toggleFilter(filterArray: string[], filter: string) {
        let index = filterArray.indexOf(filter);
        if(index < 1) {
            filterArray.splice(index, 1);
        }
        else {
            filterArray.push(filter);
        }
    }


    /**
     * Adds a year filter to body global object
     * @param year Year to apply new filter for
     */
    public addYear(year: string) {
        this.toggleFilter(this.aSeleccionados, year);
        this.updateBody();
        this.generateTopicsGraphData();
    }


    async updateBody() {


        //let ids = (this.idSelName.length > 0) ? this.idSelName : this.idSel;

        if (this.idSelName.length > 0) {
            this.body.query['bool']['filter'] = {
                ids: {
                    values: this.idSelName
                }
            };

        } else {
            if ('filter' in this.body.query['bool']) {
                delete this.body.query['bool']['filter'];
            }
        }

        if (this.tSeleccionados.length > 0) {
            this.body.query['bool']['must'] = [{
                'match': {
                    'attachment.content': {
                        'query': this.tSeleccionados.join(' '),
                        'operator': 'and'
                    }
                }
            }
            ];
        } else {
            this.body.query['bool']['must'] = [{
                match_all: {}
            }
            ];
        }


        if (this.aSeleccionados.length > 0) {

            //if("match_all" in this.body.query) delete this.body.query["match_all"];

            this.body.query['bool']['must'].push({
                'range': {
                    "attachment.date": {
                        "gte": d3.min(this.aSeleccionados) + "-01-01",
                        "lte": d3.max(this.aSeleccionados) + "-12-31"
                    }
                }
            });
        }
    }

}


