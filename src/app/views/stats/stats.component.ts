import { Component, OnInit } from '@angular/core';
import * as d3 from 'd3';
import { Document } from '../../document.model';
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

    private FILTER_TYPES = {
        TOPIC: 'TOPIC',
        YEAR: 'YEAR'
    };

    faSync = faSync;
    faTimes = faTimesCircle;
    options: string[] = [];

    // Index name to use in current instance of Stats page
    index: string;

    // lista : Lista de documentos añadidos para el índice.
    lista: Document[] = [];

    // listaH : Lista de temas del documento con su número de repeticiones
    listaH = [];

    // listaY : Lista de años de creación de los documentos con el número de documentos por año
    listaY = [];

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

    constructor(
        private elastic: ElasticsearchService,
        private route: ActivatedRoute
    ) {

        this.elastic = new ElasticsearchService();
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
                response => { ids = response.hits.hits.map((elem) => (elem._id)); },
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
                terminos.sort((elem1, elem2) => { return (elem1['value'] > elem2['value']) ? -1 : 1; });
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


    cleanFilters() {
        this.tSeleccionados = [];
        this.aSeleccionados = [];
        this.updateBody();
        this.generateTopicsGraphData();
        this.generateBarGraphData();
    }


    public async generateBarGraphData() {

        d3.select('#dbar').html('');
        //this.listaY = [];

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


    /**
     * Sets global BODY object with all selected filters
     */
    async updateBody() {
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