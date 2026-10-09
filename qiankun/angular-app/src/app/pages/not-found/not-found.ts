import { Component } from '@angular/core';
import { MaterialModule } from '../../material.module';

@Component({
  selector: 'app-not-found',
  imports: [MaterialModule],
  template: `
    <div class="app-page not-found">
      <mat-card class="app-global-card">
        <h1>404</h1>
        <p>页面不存在 —— 该路由用于测试 qiankun 下通配路由 / 404 的兜底表现。</p>
        <button mat-raised-button color="primary" routerLink="/dashboard">返回概览</button>
      </mat-card>
    </div>
  `,
  styles: `
    .not-found {
      text-align: center;
      mat-card { max-width: 420px; margin: 40px auto; padding: 32px; }
      h1 { font-size: 48px; margin: 0 0 8px; }
    }
  `,
})
export class NotFoundComponent {}
