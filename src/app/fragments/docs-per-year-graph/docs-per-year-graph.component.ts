import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import * as d3 from 'd3';
import { faSync } from '@fortawesome/free-solid-svg-icons';
import { TranslateService } from '@ngx-translate/core';
import { VisualizationService } from 'src/app/services/visualization/visualization.service';
import { VISUALIZATION_COLORS } from 'src/constants';

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

    constructor(private visualizationService: VisualizationService) { }

    ngOnChanges() {
        if (this.docsPerYearList.length) {
            this.generateGraph();
        }
        else {
            this.loaded = false;
        }
    }

    private generateGraph() {
        this.loaded = false;
        const svg = d3.select('#dbar')
            .attr('width', '600')
            .attr('height', '370');

        this.visualizationService.createBarGraph(this.docsPerYearList, this.selectedYearsList, svg);

        let anch = $('#dbar').width();
        let alt = $('#dbar').height();

        $('#refbar').css({
            position: 'relative',
            top: -alt + 5 + 'px',
            left: anch + 30 + 'px'
        }).fadeIn();

        // Add click action interactivity for topic selection
        let that = this;
        d3.selectAll('.bbar')
            .on('click', async function (actual, i) {
                let year = d3.select(this).attr('id');
                if (!that.selectedYearsList.includes(year)) {
                    that.selectedYearsList.push(year);
                    d3.select(this).transition()
                        .ease(d3.easeBack)
                        .duration(200)
                        .style('fill', VISUALIZATION_COLORS.GRAPH_BAR_DEFAULT_COLOR);
                } else {
                    that.selectedYearsList.splice(that.selectedYearsList.indexOf(year), 1);
                    d3.select(this).transition()
                        .ease(d3.easeBack)
                        .duration(200)
                        .style('fill', VISUALIZATION_COLORS.GRAPH_BAR_SELECTED_COLOR);
                }
                that.yearWasSelected.emit(that.selectedYearsList);
            });
        this.loaded = true;
    }
}