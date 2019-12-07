import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import * as d3 from 'd3';

declare var $: any;


@Component({
  selector: 'topics-graph',
  templateUrl: './topics-graph.component.html',
  styleUrls: ['./topics-graph.component.css']
})
export class TopicsGraphComponent implements OnChanges {

  @Input('topic-list') private topicList: any[];
  @Input('selected-topic-list') private selectedTopicList: string[];

  @Output() topicWasSelected: EventEmitter<string[]> = new EventEmitter<string[]>();

  private loaded: boolean = false;

  constructor() { }

  ngOnChanges() {
    if(this.topicList.length) {
      this.generateGraph();
    }
  }


  private generateGraph() {

    if(!this.topicList.length) return;

    let that = this;

        let margen = 20;
        const width = 600 - 2 * margen;
        const height = 350 - 2 * margen;
        d3.scaleOrdinal(d3.schemeCategory10);
        let media = d3.mean(this.topicList.map((d) => d.value));

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
            .data(this.topicList)
            .enter()
            .append('g')
            .attr('class', 'node');


        // CREAMOS LAS BURBUJAS DENTRO DE LOS NODOS
        node
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
                if (this.selectedTopicList.includes(d.name)) {
                    return '#00ffff';
                } else {
                    return '#00af05';
                }
            });


        // AÑADIMOS A LAS BURBUJAS LAS PALABRAS QUE LE CORRESPONDEN
        node
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
            .nodes(this.topicList)
            .on('tick', ticked);


        // FUNCIONES PARA ARRASTRAR LAS BURBUJAS
        function dragstarted(d: any) {
            simulation.restart();
            simulation.alpha(1.0);
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(d: any) {
            d.fx = d3.event.x;
            d.fy = d3.event.y;
        }

        function dragended(d: any) {
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
        svg.append('rect')
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

                if (!that.selectedTopicList.includes(tema)) {
                    that.selectedTopicList.push(tema);
                    d3.select(this).transition()
                        .ease(d3.easeBack)
                        .duration(200)
                        .style('fill', '#00af05');
                } else {
                    that.selectedTopicList.splice(that.selectedTopicList.indexOf(tema), 1);
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

              that.topicWasSelected.emit(that.selectedTopicList);
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

        this.loaded = true;

  }






}
