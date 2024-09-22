import { Component, AfterViewInit, Inject, PLATFORM_ID, ElementRef } from '@angular/core';
import { DataService } from '../data.service';
import { isPlatformBrowser } from '@angular/common';
import Chart from 'chart.js/auto';
import * as d3 from '../d3-modules';

@Component({
  selector: 'pb-homepage',
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.scss']
})
export class HomepageComponent implements AfterViewInit {
  public dataSource = {
    datasets: [
      {
        data: [] as number[],
        backgroundColor: [
          '#ffcd56', '#ff6384', '#36a2eb', '#fd6b19', '#4bc0c0', '#9966ff', '#ff9f40'
        ]
      }
    ],
    labels: [] as string[]
  };

  constructor(
    private dataService: DataService, 
    private elementRef: ElementRef,  
    @Inject(PLATFORM_ID) private platformId: any
  ) {}

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.dataService.getBudgetData().subscribe(data => {
        this.dataSource.datasets[0].data = data.myBudget.map((item: any) => item.budget);
        this.dataSource.labels = data.myBudget.map((item: any) => item.title);
        this.createChart();

        this.createD3Chart(data.myBudget);  
      });
    }
  }

  createChart(): void {
    const ctx = (document.getElementById('myChart') as HTMLCanvasElement).getContext('2d');
    if (ctx) {
      new Chart(ctx, {
        type: 'pie',
        data: this.dataSource
      });
    }
  }

  createD3Chart(data: any[]): void {
    const container = d3.select(this.elementRef.nativeElement).select('.d3-chart-container');
  
    // Remove any existing SVG within the container to prevent duplicates
    container.select('svg').remove();
  
    const containerNode = container.node() as HTMLElement;
  
    if (containerNode) {
      const containerWidth = containerNode.getBoundingClientRect().width;
      const containerHeight = containerNode.getBoundingClientRect().height;
      const radius = Math.min(containerWidth, containerHeight) / 2;
  
      // Append the SVG to the d3-chart-container instead of elementRef directly
      const svg = container
        .append('svg')
        .attr('id', 'd3Chart')
        .attr('width', containerWidth)
        .attr('height', containerHeight)
        .append('g')
        .attr('transform', `translate(${containerWidth / 2},${containerHeight / 2})`);
  
      svg.append('g').attr('class', 'slices');
      svg.append('g').attr('class', 'labels');
      svg.append('g').attr('class', 'lines');
  
      const pie = d3
        .pie<any>()
        .sort(null)
        .value((d: any) => d.budget);
  
      const arc = d3
        .arc<d3.PieArcDatum<any>>()
        .outerRadius(radius * 0.8)
        .innerRadius(radius * 0.4);
  
      const outerArc = d3
        .arc<d3.PieArcDatum<any>>()
        .innerRadius(radius * 0.9)
        .outerRadius(radius * 0.9);
  
      const key = (d: any) => d.data.title;
  
      const color = d3
        .scaleOrdinal<string>()
        .domain(data.map((d: any) => d.title))
        .range(['#98abc5', '#8a89a6', '#7b6888', '#6b486b', '#a05d56', '#d0743c', '#ff8c00']);
  
      this.change(data, svg, pie, arc, outerArc, color, radius, key);
    }
  }

  change(
    data: any[],
    svg: any,
    pie: any,
    arc: any,
    outerArc: any,
    color: any,
    radius: number,
    key: any
  ): void {
    const midAngle = (d: any) => d.startAngle + (d.endAngle - d.startAngle) / 2;

    /* ------- PIE SLICES -------*/
    let slice = svg.select('.slices').selectAll('path.slice').data(pie(data), key);

    slice.exit().remove();

    slice = slice
      .enter()
      .append('path')
      .attr('class', 'slice')
      .style('fill', (d: any) => color(d.data.title))
      .each(function (this: any, d: any) { // Fix for 'this' context
        this._current = { startAngle: d.startAngle, endAngle: d.startAngle };
      })
      .merge(slice);

    slice
      .transition()
      .duration(1000)
      .attrTween('d', function (this: any, d: any) { // Fix for 'this' context
        const interpolate = d3.interpolate(this._current, d);
        this._current = interpolate(1);
        return (t: any) => arc(interpolate(t));
      });

    /* ------- TEXT LABELS -------*/
    let text = svg.select('.labels').selectAll('text').data(pie(data), key);

    text.exit().remove();

    text = text
      .enter()
      .append('text')
      .attr('dy', '.35em')
      .each(function (this: any, d: any) { // Fix for 'this' context
        this._current = { startAngle: d.startAngle, endAngle: d.startAngle };
      })
      .merge(text);

    text
      .text((d: any) => d.data.title)
      .transition()
      .duration(1000)
      .attrTween('transform', function (this: any, d: any) { // Fix for 'this' context
        const interpolate = d3.interpolate(this._current, d);
        this._current = interpolate(1);
        return (t: any) => {
          const d2 = interpolate(t);
          const pos = outerArc.centroid(d2);
          pos[0] = radius * 1.1 * (midAngle(d2) < Math.PI ? 1 : -1);
          return 'translate(' + pos + ')';
        };
      })
      .styleTween('text-anchor', function (this: any, d: any) { // Fix for 'this' context
        const interpolate = d3.interpolate(this._current, d);
        this._current = interpolate(1);
        return (t: any) => {
          const d2 = interpolate(t);
          return midAngle(d2) < Math.PI ? 'start' : 'end';
        };
      });

    /* ------- SLICE TO TEXT POLYLINES -------*/
    let polyline = svg.select('.lines').selectAll('polyline').data(pie(data), key);

    polyline.exit().remove();

    polyline = polyline
      .enter()
      .append('polyline')
      .each(function (this: any, d: any) { // Fix for 'this' context
        this._current = { startAngle: d.startAngle, endAngle: d.startAngle };
      })
      .merge(polyline);

    polyline
      .transition()
      .duration(1000)
      .attrTween('points', function (this: any, d: any) { // Fix for 'this' context
        const interpolate = d3.interpolate(this._current, d);
        this._current = interpolate(1);
        return (t: any) => {
          const d2 = interpolate(t);
          const pos = outerArc.centroid(d2);
          pos[0] = radius * 0.95 * (midAngle(d2) < Math.PI ? 1 : -1);
          return [arc.centroid(d2), outerArc.centroid(d2), pos];
        };
      });
  }
}
