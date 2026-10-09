import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';

import { MaterialModule } from '../../material.module';

/* ============================================================
 * 弹窗内容组件集 —— 供「弹窗演示」页使用
 * 所有弹窗都由 CDK Overlay 渲染在 .cdk-overlay-container 中：
 *  - 默认挂在 document.body（qiankun 样式隔离场景下的经典问题点）；
 *  - 可在「弹窗演示」页切换为挂到 app-root 内部（见 services/
 *    app-overlay-container.ts）。
 * ============================================================ */

/** 1) 基础提示弹窗 */
@Component({
  selector: 'app-alert-dialog',
  imports: [MaterialModule],
  template: `
    <h2 mat-dialog-title>提示</h2>
    <mat-dialog-content>
      <p>这是一条来自 <strong>angular-app</strong> 的基础提示弹窗。</p>
      <p class="app-global-muted">注意：弹窗由 CDK Overlay 渲染，默认挂在 document.body。</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="'ok'">知道了</button>
    </mat-dialog-actions>
  `,
})
export class AlertDialogComponent {}

/** 2) 确认弹窗（带结果回传） */
export interface ConfirmData {
  title: string;
  message: string;
}

@Component({
  selector: 'app-confirm-dialog',
  imports: [MaterialModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <p>{{ data.message }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="false">取消</button>
      <button mat-raised-button color="warn" (click)="confirm()">确定</button>
    </mat-dialog-actions>
  `,
})
export class ConfirmDialogComponent {
  constructor(
    private readonly ref: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmData,
  ) {}

  confirm(): void {
    this.ref.close(true);
  }
}

/** 3) 表单弹窗（输入并回传数据） */
export interface FormResult {
  name: string;
  role: string;
}

@Component({
  selector: 'app-form-dialog',
  imports: [MaterialModule],
  template: `
    <h2 mat-dialog-title>新建成员</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>姓名</mat-label>
        <input matInput [(ngModel)]="name" placeholder="请输入姓名" />
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>角色</mat-label>
        <mat-select [(ngModel)]="role">
          <mat-option value="管理员">管理员</mat-option>
          <mat-option value="运营">运营</mat-option>
          <mat-option value="开发">开发</mat-option>
          <mat-option value="访客">访客</mat-option>
        </mat-select>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="null">取消</button>
      <button mat-raised-button color="primary" [disabled]="!name.trim()" (click)="submit()">提交</button>
    </mat-dialog-actions>
  `,
})
export class FormDialogComponent {
  protected name = '';
  protected role = '管理员';

  constructor(private readonly ref: MatDialogRef<FormDialogComponent>) {}

  submit(): void {
    this.ref.close({ name: this.name.trim(), role: this.role } satisfies FormResult);
  }
}

/** 4) 长内容弹窗（测试滚动、大高度在 overlay 中的表现） */
@Component({
  selector: 'app-long-dialog',
  imports: [MaterialModule],
  template: `
    <h2 mat-dialog-title>长内容弹窗</h2>
    <mat-dialog-content>
      @for (p of paragraphs; track p) {
        <p>{{ p }}</p>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="'closed'">关闭</button>
    </mat-dialog-actions>
  `,
})
export class LongDialogComponent {
  protected readonly paragraphs = Array.from(
    { length: 24 },
    (_, i) =>
      `第 ${i + 1} 段：这是用来验证「长内容弹窗」在 qiankun 挂载环境下滚动与高度表现的占位文本。` +
      `接入后请重点检查：滚动是否正常、遮罩是否覆盖全屏、内容是否溢出容器。`,
  );
}

/** 5) 嵌套弹窗（从弹窗中再打开弹窗） */
@Component({
  selector: 'app-nested-dialog',
  imports: [MaterialModule],
  template: `
    <h2 mat-dialog-title>嵌套弹窗</h2>
    <mat-dialog-content>
      <p>我是第一层弹窗，点击下面按钮再打开一层子弹窗。</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="null">关闭</button>
      <button mat-raised-button color="accent" (click)="openChild()">打开子弹窗</button>
    </mat-dialog-actions>
  `,
})
export class NestedDialogComponent {
  constructor(
    private readonly ref: MatDialogRef<NestedDialogComponent>,
    private readonly dialog: MatDialog,
  ) {}

  openChild(): void {
    this.dialog
      .open(ChildDialogComponent, { width: '300px' })
      .afterClosed()
      .subscribe((v) => {
        if (v) {
          this.ref.close(v);
        }
      });
  }
}

@Component({
  selector: 'app-child-dialog',
  imports: [MaterialModule],
  template: `
    <h2 mat-dialog-title>子弹窗</h2>
    <mat-dialog-content>
      <p>我是第二层弹窗，用于测试多层 overlay 的层级关系。</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="null">取消</button>
      <button mat-raised-button color="primary" [mat-dialog-close]="'nested-ok'">确认</button>
    </mat-dialog-actions>
  `,
})
export class ChildDialogComponent {}
