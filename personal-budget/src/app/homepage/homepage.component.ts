import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import Chart from 'chart.js/auto';

@Component({
  selector: 'pb-homepage',
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.scss']  
})
export class HomepageComponent implements OnInit {
  public dataSource = {
    datasets: [
      {
        data: [] as number[],
        backgroundColor: [
          '#ffcd56',
          '#ff6384',
          '#36a2eb',
          '#fd6b19',
          '#4bc0c0',
          '#9966ff',
          '#ff9f40'
        ]
      }
    ],
    labels: [] as string[]
  };

  constructor(private http: HttpClient, @Inject(PLATFORM_ID) private platformId: any) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Fetch the data and create the chart only when data is available
      this.http.get('http://localhost:3000/budget').subscribe((res: any) => {
        for (var i = 0; i < res.myBudget.length; i++) {
          this.dataSource.datasets[0].data[i] = res.myBudget[i].budget;
          this.dataSource.labels[i] = res.myBudget[i].title;
        }
        this.createChart();  
      });
    }
  }

  createChart() {
    var canvas = document.getElementById('myChart') as HTMLCanvasElement;
    if (canvas) {
      var ctx = canvas.getContext('2d');
      if (ctx) {
        new Chart(ctx, {
          type: 'pie',
          data: this.dataSource
        });
      } else {
        console.error('Unable to get 2D context for the canvas.');
      }
    } else {
      console.error('Canvas element not found.');
    }
  }
}
