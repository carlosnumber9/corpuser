import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import * as d3 from 'd3';
import { faSync } from '@fortawesome/free-solid-svg-icons';
import { VisualizationService } from 'src/app/visualization.service';

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
  private faSync = faSync;



  constructor(private visualizationService: VisualizationService) { }

  ngOnChanges() {
    if(this.topicList.length) {
      this.generateGraph();
    }
    else {
        this.loaded = false;
    }
  }


  private generateGraph() {

    this.loaded = false;

    const svg = d3.select('#dbub')
    .attr('width', 600)
    .attr('height', 350);

    this.visualizationService.createBubbleChart(this.topicList, this.selectedTopicList, svg);

    // Click event on bubble control (filtering topics)
    let that = this;
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
      that.topicWasSelected.emit(that.selectedTopicList);
    });

    this.loaded = true;
  }






}
