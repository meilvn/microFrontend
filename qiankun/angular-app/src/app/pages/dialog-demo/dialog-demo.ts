import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { MaterialModule } from '../../material.module';
import {
  AlertDialogComponent,
  ChildDialogComponent,
  ConfirmDialogComponent,
  FormDialogComponent,
  LongDialogComponent,
  NestedDialogComponent,
} from './dialog-components';

@Component({
  selector: 'app-dialog-demo',
  imports: [MaterialModule],
  templateUrl: './dialog-demo.html',
  styleUrl: './dialog-demo.scss',
})
export class DialogDemoComponent {
  protected lastResult: string | null = null;
  protected overlayInside = localStorage.getItem('angular-app.overlayInside') === '1';

  constructor(
    private readonly dialog: MatDialog,
    private readonly snackbar: MatSnackBar,
  ) {}

  protected openAlert(): void {
    this.dialog.open(AlertDialogComponent, { width: '380px' });
  }

  protected openConfirm(): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '380px',
      data: { title: '操作确认', message: '确定要执行该操作吗？弹窗会把结果回传。' },
    });
    ref.afterClosed().subscribe((v) => {
      this.showResult(`确认弹窗返回：${v === true ? '确定' : '取消'}`);
    });
  }

  protected openForm(): void {
    const ref = this.dialog.open(FormDialogComponent, { width: '420px' });
    ref.afterClosed().subscribe((v) => {
      if (v) {
        this.showResult(`表单弹窗返回：${v.name}（${v.role}）`);
      } else {
        this.showResult('表单弹窗已取消');
      }
    });
  }

  protected openLong(): void {
    this.dialog.open(LongDialogComponent, { width: '480px', maxHeight: '70vh' });
  }

  protected openNested(): void {
    const ref = this.dialog.open(NestedDialogComponent, { width: '400px' });
    ref.afterClosed().subscribe((v) => {
      this.showResult(`嵌套弹窗最终返回：${v ?? '关闭'}`);
    });
  }

  protected openChild(): void {
    this.dialog.open(ChildDialogComponent, { width: '320px' });
  }

  /** 切换 CDK overlay 挂载模式（body ↔ app-root 内部），刷新后生效 */
  protected toggleOverlayMode(): void {
    localStorage.setItem('angular-app.overlayInside', this.overlayInside ? '0' : '1');
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: '切换弹窗挂载模式',
        message: this.overlayInside
          ? '当前：挂到 document.body（复现样式隔离问题）。改为挂到 app-root 内部？需要刷新页面生效。'
          : '当前：挂到 app-root 内部（规避样式隔离问题）。改回 document.body？需要刷新页面生效。',
      },
    });
    ref.afterClosed().subscribe((ok) => {
      if (ok) {
        window.location.reload();
      }
    });
  }

  /** 当前 overlay 容器的实际挂载位置（供排查） */
  protected overlayParentInfo(): string {
    const container = document.querySelector('.cdk-overlay-container');
    if (!container) {
      return '尚未创建任何弹窗，overlay 容器还不存在';
    }
    const parent = container.parentElement;
    return `当前 .cdk-overlay-container 挂在 <${parent?.tagName.toLowerCase() ?? 'unknown'}> 下`;
  }

  private showResult(msg: string): void {
    this.lastResult = msg;
    this.snackbar.open(msg, '关闭', { duration: 3000 });
  }
}
