import { Injectable } from '@angular/core';
import * as d3 from 'd3';
import { TranslateService } from '@ngx-translate/core';
import { VISUALIZATION_COLORS } from 'src/constants';
import { BehaviorSubject } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class VisualizationService {

  constructor(private translateService: TranslateService) { }



  public createBarGraph(dataSet: any[], selectedItemsList: any[], svgSelector: d3.Selection<d3.BaseType, unknown, HTMLElement, any>) {

    const that = this;

    // DEFINIMOS LAS DIMENSIONES Y MÁRGENES
    const margin = 60;
    const width = 600 - 2 * margin;
    const height = 350 - 2 * margin;

    // CREAMOS LA REGIÓN DEL DIAGRAMA DENTRO DEL SVG
    const chart = svgSelector.append('g')
      .attr('transform', `translate(${margin}, ${margin})`);

    // ESTABLECEMOS LA ESCALA DEL EJE Y
    const yScale = d3.scaleLinear()
      .range([height, 0])
      .domain([0, d3.max(dataSet.map((s) => s.reps))]);

    // CREAMOS EL EJE Y UTILIZANDO SU ESCALA
    chart.append('g')
      .call(d3.axisLeft(yScale));

    // ESTABLECEMOS LA ESCALA DEL EJE X
    const xScale = d3.scaleBand()
      .range([0, width])
      .domain(dataSet.map((s) => s.ano))
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
      .data(dataSet)
      .enter()
      .append('rect')
      .attr('x', (s) => xScale(s.ano))
      .attr('y', (s) => yScale(s.reps))
      .attr('height', (s) => height - yScale(s.reps))
      .attr('width', xScale.bandwidth())
      .attr('fill', (d) => {
        if (selectedItemsList.indexOf(d.ano)) {
          return VISUALIZATION_COLORS.GRAPH_BAR_SELECTED_COLOR;
        } else {
          return VISUALIZATION_COLORS.GRAPH_BAR_DEFAULT_COLOR;
        }
      })
      .attr('stroke', 'blue')
      .attr('id', (s) => s.ano)
      .attr('class', 'bbar');

    // AÑADIMOS ETIQUETA PARA EL EJE Y
    svgSelector.append('text')
      .attr('x', -(height / 2) - margin)
      .attr('y', margin / 2.4)
      .attr('transform', 'rotate(-90)')
      .attr('text-anchor', 'middle')
      .text(this.translateService.instant('fragments.docsPerYearGraph.docCount'));

    // AÑADIMOS ETIQUETA PARA EL EJE X
    svgSelector.append('text')
      .attr('x', (width / 2) + margin)
      .attr('y', (height * 1.155) + margin)
      .attr('text-anchor', 'middle')
      .text(this.translateService.instant('fragments.docsPerYearGraph.postDate'));

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

    // AÑADIMOS UN TEXTO DE TÍTULO PARA EL DIAGRAMA
    svgSelector.append('text')
      .attr('x', width / 2 + margin)
      .attr('y', 40)
      .attr('text-anchor', 'middle')
      .text(this.translateService.instant('fragments.docsPerYearGraph.title'));

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


    // BORDE DEL DIAGRAMA
    svgSelector.append('rect')
      .attr('x', margin)
      .attr('y', margin)
      .attr('height', height)
      .attr('width', width)
      .attr('stroke', 'gray')
      .attr('fill', 'none')
      .attr('stroke-width', 'border');

  }


}
