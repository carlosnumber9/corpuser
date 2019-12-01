import { Component, OnInit, ElementRef, OnChanges } from '@angular/core';
import * as d3 from 'd3';
import { Index } from '../index.model';
import { Document } from '../document.model';
import { HttpHeaders } from '@angular/common/http';
import { ElasticsearchService } from '../elasticsearch.service';
import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { faSync, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import { ActivatedRoute } from '@angular/router';

declare var $: any;


@Component({
    selector: 'app-stats',
    templateUrl: './stats.component.html',
    styleUrls: ['./stats.component.css']
})
export class StatsComponent implements OnInit, OnChanges {

    loaded: {
        dBar1;
        dBub1;
    };


    faSync = faSync;
    faTimes = faTimesCircle;

    myControl = new FormControl();
    options: string[] = [];
    filteredOptions: Observable<string[]>;
    filteredValue: string[];
    searchText = '';

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
                error => console.log(error)
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

                let sortedByOccurrenceCountTerms = terminos
                    .sort((elem1, elem2) => {
                        return (elem1['value'] > elem2['value']) ? -1 : 1;
                    });
                //.slice(0, 6);

                this.options = sortedByOccurrenceCountTerms.map(elem => elem['name']);

            }, (err) => {
                console.log('Error con los term vectors.');
                console.log(err);
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

            }, error => console.log(error)
        );

    }


    private _filter(value: string, opciones): string[] {
        const filterValue = value.toLowerCase();
        return opciones.filter(option => option.toLowerCase().includes(filterValue));
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
        this.filteredOptions = this.myControl.valueChanges
            .pipe(
                startWith(''),
                map(value => this._filter(value, this.options))
            );

        this.loaded = {
            dBar1: false,
            dBub1: false
        };

        /*
        d3.select('#dbub')
          .attr('width', '700')
          .attr('height', '400');

        d3.select('#dbar')
          .attr('width', '700')
          .attr('height', '450');
    */


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

        let maximo = $('#diagramas').height();
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
        this.generateBubbleChart();
        this.generateBarGraph();


        /*
            if(!this.idSelName.includes(id)) this.idSelName.push(id);
            else delete this.idSelName[this.idSelName.indexOf(id)];

            console.log(this.idSelName);


            this.gen_bubbles();
            this.gen_dTemas();
        */
    }


    onSelect(event) {
        console.log(event);
        console.log('Aquí se pueden hacer cositass');
        console.log(event.name);
    }


    ngOnChanges(): void {
        if (!this.listaH) {
            return;
        }
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
                this.generateBarGraph();
                this.generateBubbleChart();
            }, error => {
                console.error(error);
                console.log('There was an error trying to retrieve the total document list. (getTotalDocumentList)');
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

            this.listaH = this.listaH.sort((elem1, elem2) => {
                return (elem1['value'] > elem2['value']) ? -1 : 1;
            });

            this.listaH = this.listaH.slice(0, 15);
        }
    }


    limpiarFiltros() {

        this.tSeleccionados = [];
        this.aSeleccionados = [];

        this.updateBody();

        this.generateBubbleChart();
        this.generateBarGraph();

    }


    /*
      get_YV(){

        let result = [];

        for(let doc of this.lista){
          let fecha = new Date(doc.fecha);
          let ano = (doc.fecha) ? fecha.getFullYear() : "(Desconocido)";

          if(ano == "(Desconocido)") {
            this.corpusLimpio = false;
            this.noLimpios = this.noLimpios + 1;
          }
          else{
            let encontrado = false;
          for(let elem of result){
            if(ano == "(Desconocido)") break;
            if(elem.ano == ano) {
              elem.reps = elem.reps + 1;
              encontrado = true;
            }
          }

          if(!encontrado) result.push({
            ano : ano,
            reps : 1
          });
          }


        }

        //for(let elem of result) console.log("Año " + elem.ano + " con " + elem.reps + " documentos.");

        result = result.sort((elem1, elem2) => {
          if(elem1["ano"] == "(Desconocido)") return -1;
          else if (elem2["ano"] == "(Desconocido)") return 1;
          else return (elem1["ano"] < elem2["ano"]) ? -1 : 1;
        });




        this.listaY = result;

      }
    */


    public async generateBarGraph() {

        const that = this;
        d3.select('#dbar').html('');
        //this.listaY = [];

        this.loaded['dBar1'] = false;

        let rest = 0;
        // Creamos body, el cuerpo de la petición para sacar los documentos por año.

        // Llamamos al método de búsqueda del servicio de ES y metemos la info en listaY.
        await this.elastic.search(this.index, this.body)
            .then(response => {

                this.listaY = response.aggregations.dates.buckets.map((elem) => ({
                    ano: new Date(elem.key_as_string).getFullYear(),
                    reps: elem.doc_count
                }));

                this.idSel = response.hits.hits.map((elem) => (elem._id));

                rest = response.hits.total - d3.sum(this.listaY.map(e => e.reps));

            },
                error => {
                    console.log(error);
                });

        // DEFINIMOS LAS DIMENSIONES Y MÁRGENES
        const margin = 60;
        const width = 600 - 2 * margin;
        const height = 350 - 2 * margin;

        // ALMACENAMOS EN UNA VARIABLE EL CONTENEDOR SVG
        const svg = d3.select('#dbar')
            .attr('width', '600')
            .attr('height', '370');

        // CREAMOS LA REGIÓN DEL DIAGRAMA DENTRO DEL SVG
        const chart = svg.append('g')
            .attr('transform', `translate(${margin}, ${margin})`);

        // ESTABLECEMOS LA ESCALA DEL EJE Y
        const yScale = d3.scaleLinear()
            .range([height, 0])
            .domain([0, d3.max(this.listaY.map((s) => s.reps))]);

        // CREAMOS EL EJE Y UTILIZANDO SU ESCALA
        chart.append('g')
            .call(d3.axisLeft(yScale));

        // ESTABLECEMOS LA ESCALA DEL EJE X
        const xScale = d3.scaleBand()
            .range([0, width])
            .domain(this.listaY.map((s) => s.ano))
            .padding(0.2);

        // CREAMOS EL EJE X UTILIZANDO SU ESCALA
        chart.append('g')
            .attr('transform', `translate(0, ${height})`)
            .call(d3.axisBottom(xScale));

        // AÑADIMOS LÍNEAS VERTICALES DE REFERENCIA PARA EL FONDO
        /*
        chart.append('g')
          .attr('class', 'grid')
          .attr('transform', `translate(0, ${height})`)
          .call(d3.axisBottom()
            .scale(xScale)
            .tickSize(-height, 0, 0)
            .tickFormat(''));
        */

        // AÑADIMOS LÍNEAS HORIZONTALES DE REFERENCIA PARA EL FONDO
        /*
        chart.append('g')
          .attr('class', 'grid')
          .attr('opacity', '0.3')
          .call(d3.axisLeft()
            .scale(yScale)
            .tickSize(-width, 0, 0)
            .tickFormat(''));
        */


        // AÑADIMOS LAS BARRAS PARA CADA ELEMENTO DE LA LISTA (DATOS)
        let barras = chart.selectAll()
            .data(this.listaY)
            .enter()
            .append('rect')
            .attr('x', (s) => xScale(s.ano))
            .attr('y', (s) => yScale(s.reps))
            .attr('height', (s) => height - yScale(s.reps))
            .attr('width', xScale.bandwidth())
            .attr('fill', (d) => {
                if (this.aSeleccionados.indexOf(d.ano)) {
                    return '#00ffff';
                } else {
                    return '#00af05';
                }
            })
            .attr('stroke', 'blue')
            .attr('id', (s) => s.ano)
            .attr('class', 'bbar');


        // AÑADIMOS ETIQUETA PARA EL EJE Y
        svg.append('text')
            .attr('x', -(height / 2) - margin)
            .attr('y', margin / 2.4)
            .attr('transform', 'rotate(-90)')
            .attr('text-anchor', 'middle')
            .text('Número de documentos');

        // AÑADIMOS ETIQUETA PARA EL EJE X
        svg.append('text')
            .attr('x', (width / 2) + margin)
            .attr('y', (height * 1.155) + margin)
            .attr('text-anchor', 'middle')
            .text('Año de publicación');


        if (rest) {
            let aux = (rest == 1) ? 'Existe' : 'Existen';
            let aux1 = (rest == 1) ? 'documento' : 'documentos';
            svg.append('text')
                .attr('x', (width / 2) + margin)
                .attr('y', (height * 1.155) + 1.4 * margin)
                .attr('text-anchor', 'middle')
                .attr('font-size', 13)
                .text(aux + ' ' + rest + ' ' + aux1 + ' sin fecha de publicación conocida.');
        }


        let anch = $('#dbar').width();
        let alt = $('#dbar').height();

        $('#refbar').css({
            position: 'relative',
            top: -alt + 5 + 'px',
            left: anch + 30 + 'px'
        }).fadeIn();


        // AÑADIMOS UN TEXTO DE TÍTULO PARA EL DIAGRAMA
        svg.append('text')
            .attr('x', width / 2 + margin)
            .attr('y', 40)
            .attr('text-anchor', 'middle')
            .text('Cronología del corpus');


        // AÑADIMOS EL EFECTO DE CAMBIO DE CURSOR AL PASAR POR ENCIMA.
        d3.selectAll('rect')
            .on('mouseover', function (actual, i) {
                d3.select(this).style('cursor', 'pointer');
                d3.select(this).transition()
                    .ease(d3.easeBack)
                    .duration(200)
                    .attr('opacity', '0.5');
            })
            .on('mouseout', function (actual, i) {
                d3.select(this).style('cursor', 'default');
                d3.select(this).transition()
                    .ease(d3.easeBack)
                    .duration(1000)
                    .attr('opacity', '1');
            });


        // AÑADIMOS LAS FUNCIONES DE INTERACTIVIDAD AL ELEGIR (PULSAR) UN AÑO DEL DIAGRAMA.
        d3.selectAll('.bbar')
            .on('click', async function (actual, i) {

                let ano = d3.select(this).attr('id');
                //console.log("Se quiere insertar el año " + ano + " en tSeleccionados.");

                //if(that.aSeleccionados.length == 0) console.log("La lista de años está vacía.");


                if (!that.aSeleccionados.includes(ano)) {
                    that.aSeleccionados.push(ano);
                    d3.select(this).transition()
                        .ease(d3.easeBack)
                        .duration(200)
                        .style('fill', '#00af05');
                } else {
                    that.aSeleccionados.splice(that.aSeleccionados.indexOf(ano), 1);
                    d3.select(this).transition()
                        .ease(d3.easeBack)
                        .duration(200)
                        .style('fill', '#00ffff');
                }

                /*
                    let indice = that.anadirAno(ano);
                    if(indice < 0) {
                      d3.select(this).transition()
                        .ease(d3.easeBack)
                        .duration(200)
                        .style("fill", '#00af05');
                    }
                    else {
                      d3.select(this).transition()
                        .ease(d3.easeBack)
                        .duration(200)
                        .style("fill", '#00ffff');
                    }
                */
                await that.updateBody();
                that.generateBubbleChart();


            });


        // BORDE DEL DIAGRAMA
        let borde = svg.append('rect')
            .attr('x', margin)
            .attr('y', margin)
            .attr('height', height)
            .attr('width', width)
            .attr('stroke', 'gray')
            .attr('fill', 'none')
            .attr('stroke-width', 'border');


        this.loaded['dBar1'] = true;


    }


    public async generateBubbleChart() {


        d3.select('#dbub').html('');
        this.listaH = [];

        this.loaded['dBub1'] = false;

        let ids = [];
        
        await this.elastic.search(this.index, this.body)
            .then(response => {

                this.idSel = response.hits.hits.map((elem) => elem._id);
                ids = (this.idSelName.length > 0) ? this.idSelName : this.idSel;


                //if(this.idSelName.length == 0) this.idSel = ids;
                //else this.idSel = this.idSelName;
                //let intersec = ids.filter((elem) => this.idSelName.includes(elem));


            }, error => console.log(error));

        // Realizamos una petición de multiterm vectors para obtener los temas.
        console.log('index = ' + this.index);

        await this.elastic.getTermsList('testdocs', 'attachment.content', ids).then(
            response => {

                let terms = {};
                for (let doc of response.docs) {

                    //console.log("Los terms para el documento " + doc._id + " son:");
                    //console.log(doc.term_vectors["attachment.content"].terms);


                    Object.assign(terms, doc.term_vectors['attachment.content'].terms);
                }


                for (let key in terms) {
                    this.listaH.push({
                        'name': key,
                        'value': terms[key].ttf
                    });
                }

                this.listaH = this.listaH
                    .sort((elem1, elem2) => {
                        return (elem1['value'] > elem2['value']) ? -1 : 1;
                    })
                    .slice(0, 15);

            }, (err) => {
                console.log('Error con los term vectors.');
                console.log(err);
            }
        );


        let that = this;

        let margen = 20;
        const width = 600 - 2 * margen;
        const height = 350 - 2 * margen;
        let color = d3.scaleOrdinal(d3.schemeCategory10);
        let factor = d3.min(this.listaH.map((d) => d.value));
        let maximo = d3.max(this.listaH.map((d) => d.value));
        let media = d3.mean(this.listaH.map((d) => d.value));


        // SELECCIONAMOS EL OBJETO SVG Y LE APLICAMOS LAS DIMENSIONES
        const svg = d3.select('#dbub')
            .attr('width', 600)
            .attr('height', 350);


        // ESTABLECEMOS LAS FUERZAS QUE VAN A PRODUCIRSE ENTRE LAS BURBUJAS
        let simulation = d3.forceSimulation()
            .force('collide', d3.forceCollide(35).iterations(1000))
            .force('charge', d3.forceManyBody().strength(-300).distanceMin(300).distanceMax(400))
            .force('atract', d3.forceManyBody().strength(450).distanceMin(400).distanceMax(500));


        // AÑADIMOS DENTRO DEL SVG LOS NODOS DE INFORMACIÓN
        let node = svg.selectAll('g')
            .data(this.listaH)
            .enter()
            .append('g')
            .attr('class', 'node');


        // CREAMOS LAS BURBUJAS DENTRO DE LOS NODOS
        let circles = node
            .append('circle')
            .attr('cx', width / 2)
            .attr('cy', height / 2)
            .attr('class', 'bbub')
            .attr('id', (d) => d.name)
            .attr('r', function (d) {
                return d.value / media * 25;
            })
            //.attr('r', function(d) { return d.value * factor / 200 })
            .attr('stroke', 'blue')
            .attr('fill', (d) => {
                if (this.tSeleccionados.indexOf(d.name)) {
                    return '#00ffff';
                } else {
                    return '#00af05';
                }
            });


        // AÑADIMOS A LAS BURBUJAS LAS PALABRAS QUE LE CORRESPONDEN
        let text = node
            .append('text')
            .attr('font-size', 15)
            .attr('x', width / 2)
            .attr('y', height / 2)
            .attr('dx', -15)
            .attr('class', 'tbub')
            .attr('id', (d) => 't' + d.name)
            .style('color', 'black')
            .text(function (d) {
                return d.name;
            });

        // AÑADIMOS EFECTO DE ARRASTRAR LAS BURBUJAS
        node.call(d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended));


        let ticked = () => {
            node
                .attr('transform', function (d) {
                    return 'translate(' + d.x + ',' + d.y + ')';
                });
        };

        simulation
            .nodes(this.listaH)
            .on('tick', ticked);


        // FUNCIONES PARA ARRASTRAR LAS BURBUJAS
        function dragstarted(d) {
            simulation.restart();
            simulation.alpha(1.0);
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(d) {
            d.fx = d3.event.x;
            d.fy = d3.event.y;
        }

        function dragended(d) {
            d.fx = null;
            d.fy = null;
            simulation.alphaTarget(0.1);

        }


        let anch = $('#dbub').width();
        let alt = $('#dbub').height();

        $('#refbub').css({
            position: 'relative',
            top: -alt + 25 + 'px',
            left: anch + 10 + 'px'
        }).fadeIn();


        // BORDE DEL DIAGRAMA
        let borde = svg.append('rect')
            .attr('x', margen)
            .attr('y', margen)
            .attr('height', height)
            .attr('width', width)
            .attr('stroke', 'gray')
            .attr('fill', 'none')
            .attr('stroke-width', 'border');


        // AÑADIMOS UN TEXTO DE TÍTULO PARA EL DIAGRAMA
        svg.append('text')
            .attr('x', width / 2 + margen)
            .attr('y', 40)
            .attr('text-anchor', 'middle')
            .text('Ideas principales');


        // AÑADIMOS EL CONTROLADOR PARA LA GESTIÓN DE FILTROS AL ELEGIR UNA BURBUJA
        d3.selectAll('.bbub')
            .on('click', function (actual, i) {
                let tema = d3.select(this).attr('id');
                console.log('Se quiere insertar el tema ' + tema + ' en tSeleccionados.');


                if (!that.tSeleccionados.includes(tema)) {
                    that.tSeleccionados.push(tema);
                    d3.select(this).transition()
                        .ease(d3.easeBack)
                        .duration(200)
                        .style('fill', '#00af05');
                } else {
                    that.tSeleccionados.splice(that.tSeleccionados.indexOf(tema), 1);
                    d3.select(this).transition()
                        .ease(d3.easeBack)
                        .duration(200)
                        .style('fill', '#00ffff');
                }

                /*
                    let indice = that.anadirTema(tema);
                    if(indice < 0) {
                      d3.select(this).transition()
                        .ease(d3.easeBack)
                        .duration(200)
                        .style("fill", '#00af05');
                    }
                    else {
                      d3.select(this).transition()
                        .ease(d3.easeBack)
                        .duration(200)
                        .style("fill", '#00ffff');
                    }
                */


                that.updateBody();
                that.generateBarGraph();


            });


        // AÑADIMOS ANIMACIONES DE CAMBIO DE COLOR AL PASAR EL RATÓN POR ENCIMA
        d3.selectAll('.bbub')
            .on('mouseover', function (actual, i) {
                d3.select(this).style('cursor', 'pointer');
                d3.select(this).transition()
                    .ease(d3.easeBack)
                    .duration(200)
                    .attr('fill', '#0e9e9e');
            })
            .on('mouseout', function (actual, i) {
                d3.select(this).style('cursor', 'default');
                d3.select(this).transition()
                    .ease(d3.easeBack)
                    .duration(1000)
                    .attr('fill', '#00ffff');
            });


        // AÑADIMOS EL EFECTO DE CAMBIO DE CURSOR AL PASAR POR ENCIMA.
        d3.selectAll('.tbub')
            .on('mouseover', function (actual, i) {
                d3.select(this).style('cursor', 'pointer');
            })
            .on('mouseout', function (actual, i) {
                d3.select(this).style('cursor', 'default');
            });


        this.loaded['dBub1'] = true;


        console.log('Ahora idSel vale:');
        console.log(this.idSel);


    }


    public anadirTema(tema: string): number {

        let indice = this.tSeleccionados.indexOf(tema);

        if (indice < 0) {
            this.tSeleccionados.push(tema);
        } else {
            this.tSeleccionados.splice(indice, 1);
        }

        this.updateBody();
        this.generateBarGraph();


        return indice;

    }


    public anadirAno(ano: string): number {

        let indice = this.aSeleccionados.indexOf(ano);

        if (indice < 0) {
            this.aSeleccionados.push(ano);
        } else {
            this.aSeleccionados.splice(indice, 1);
        }

        this.updateBody();
        this.generateBubbleChart();


        return indice;

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

            //console.log("Se va a poner un filtro entre los años " + d3.min(this.aSeleccionados) + " y " + d3.max(this.aSeleccionados) + ".");
        }


        console.log("Ahora idSel vale:");
        console.log(this.body);
        console.log(JSON.stringify(this.body, null, 4));

    }


}


