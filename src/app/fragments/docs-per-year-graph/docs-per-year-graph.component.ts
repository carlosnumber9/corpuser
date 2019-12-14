import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import * as d3 from 'd3';
import { faSync } from '@fortawesome/free-solid-svg-icons';

declare var $: any;


@Component({
  selector: 'docs-per-year-graph',
  templateUrl: './docs-per-year-graph.component.html',
  styleUrls: ['./docs-per-year-graph.component.css']
})
export class DocsPerYearGraphComponent implements OnChanges {

  @Input('docs-per-year-list') private docsPerYearList: any[];
  @Input('selected-years-list') private selectedYearsList: any[];

  @Output() yearWasSelected: EventEmitter<string[]> = new EventEmitter<string[]>();

  private loaded: boolean = false;
  private faSync = faSync;

  private GRAPH_BAR_DEFAULT_COLOR = '#00af05'; 
    private GRAPH_BAR_SELECTED_COLOR = '#00ffff'; 

  constructor() { }

  ngOnChanges() {
    if(this.docsPerYearList.length) {
      this.generateGraph();
    }
    else {
      this.loaded = false;
    }
  }



  private generateGraph() {

    const that = this;

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
        .domain([0, d3.max(this.docsPerYearList.map((s) => s.reps))]);

    // CREAMOS EL EJE Y UTILIZANDO SU ESCALA
    chart.append('g')
        .call(d3.axisLeft(yScale));

    // ESTABLECEMOS LA ESCALA DEL EJE X
    const xScale = d3.scaleBand()
        .range([0, width])
        .domain(this.docsPerYearList.map((s) => s.ano))
        .padding(0.2);

    // CREAMOS EL EJE X UTILIZANDO SU ESCALA
    chart.append('g')
        .attr('transform', `translate(0, ${height})`)
        .call(d3.axisBottom(xScale));

    // Vertical reference lines on graph background
    /*
    chart.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(0, ${height})`)
      .call(d3.axisBottom()
        .scale(xScale)
        .tickSize(-height, 0, 0)
        .tickFormat(''));
    */

    // Horizontal reference lines on graph background
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
    chart.selectAll()
        .data(this.docsPerYearList)
        .enter()
        .append('rect')
        .attr('x', (s) => xScale(s.ano))
        .attr('y', (s) => yScale(s.reps))
        .attr('height', (s) => height - yScale(s.reps))
        .attr('width', xScale.bandwidth())
        .attr('fill', (d) => {
            if (this.selectedYearsList.indexOf(d.ano)) {
                return this.GRAPH_BAR_SELECTED_COLOR;
            } else {
                return this.GRAPH_BAR_DEFAULT_COLOR;
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


    // TODO: Recover rest variable utility with data service
    // if (rest) {
    //     let aux = (rest == 1) ? 'Existe' : 'Existen';
    //     let aux1 = (rest == 1) ? 'documento' : 'documentos';
    //     svg.append('text')
    //         .attr('x', (width / 2) + margin)
    //         .attr('y', (height * 1.155) + 1.4 * margin)
    //         .attr('text-anchor', 'middle')
    //         .attr('font-size', 13)
    //         .text(aux + ' ' + rest + ' ' + aux1 + ' sin fecha de publicación conocida.');
    // }


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

            if (!that.selectedYearsList.includes(ano)) {
                that.selectedYearsList.push(ano);
                d3.select(this).transition()
                    .ease(d3.easeBack)
                    .duration(200)
                    .style('fill', '#00af05');
            } else {
                that.selectedYearsList.splice(that.selectedYearsList.indexOf(ano), 1);
                d3.select(this).transition()
                    .ease(d3.easeBack)
                    .duration(200)
                    .style('fill', '#00ffff');
            }
           that.yearWasSelected.emit(that.selectedYearsList);
        });


    // BORDE DEL DIAGRAMA
    svg.append('rect')
        .attr('x', margin)
        .attr('y', margin)
        .attr('height', height)
        .attr('width', width)
        .attr('stroke', 'gray')
        .attr('fill', 'none')
        .attr('stroke-width', 'border');


    this.loaded = true;
  }

}
