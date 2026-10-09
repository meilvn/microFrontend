import { Component } from '@angular/core';
import { MaterialModule } from '../../material.module';
import { ACTIVITIES } from '../../shared/mock-data';

@Component({
  selector: 'app-dashboard',
  imports: [MaterialModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardComponent {
  protected readonly stats = [
    { icon: 'group', label: '用户总数', value: '12,348', trend: '+12.5%', up: true },
    { icon: 'receipt_long', label: '订单总数', value: '1,892', trend: '+3.2%', up: true },
    { icon: 'payments', label: '本月营收', value: '¥452k', trend: '-1.4%', up: false },
    { icon: 'trending_up', label: '转化率', value: '3.42%', trend: '+0.8%', up: true },
  ];

  protected readonly activities = ACTIVITIES;
}
