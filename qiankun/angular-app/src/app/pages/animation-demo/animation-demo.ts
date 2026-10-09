import { Component, signal } from '@angular/core';
import { animate, style, transition, trigger } from '@angular/animations';

import { MaterialModule } from '../../material.module';

/** 列表项进入/离开动画 —— 测试 qiankun 下 @angular/animations 的表现 */
const itemAnim = trigger('itemAnim', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateX(-20px)' }),
    animate('280ms ease-out', style({ opacity: 1, transform: 'translateX(0)' })),
  ]),
  transition(':leave', [
    animate('240ms ease-in', style({ opacity: 0, transform: 'translateX(20px)' })),
  ]),
]);

@Component({
  selector: 'app-animation-demo',
  imports: [MaterialModule],
  templateUrl: './animation-demo.html',
  styleUrl: './animation-demo.scss',
  animations: [itemAnim],
})
export class AnimationDemoComponent {
  /** 可增删的列表，:enter / :leave 动画 */
  protected readonly items = signal([
    '需求评审',
    '原型设计',
    '前端开发',
    '联调测试',
    '灰度发布',
    '上线观察',
  ]);
  private nextId = 100;

  /** 进度条动画（0 → 100%） */
  protected progress = signal(0);
  private progressTimer: number | null = null;
  protected progressRunning = false;

  protected addItem(): void {
    this.items.update((list) => [...list, `新任务 #${this.nextId++}`]);
  }

  protected removeItem(index: number): void {
    this.items.update((list) => list.filter((_, i) => i !== index));
  }

  protected toggleProgress(): void {
    if (this.progressRunning) {
      this.stopProgress();
      return;
    }
    this.progressRunning = true;
    this.progress.set(0);
    this.progressTimer = window.setInterval(() => {
      const next = this.progress() + 5;
      if (next >= 100) {
        this.progress.set(100);
        this.stopProgress();
      } else {
        this.progress.set(next);
      }
    }, 120);
  }

  private stopProgress(): void {
    if (this.progressTimer !== null) {
      clearInterval(this.progressTimer);
      this.progressTimer = null;
    }
    this.progressRunning = false;
  }
}
