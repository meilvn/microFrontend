import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { MaterialModule } from '../../material.module';
import { MOCK_USERS, type UserRow, type UserStatus } from '../../shared/mock-data';
import { ConfirmDialogComponent } from '../dialog-demo/dialog-components';

@Component({
  selector: 'app-table-demo',
  imports: [MaterialModule],
  templateUrl: './table-demo.html',
  styleUrl: './table-demo.scss',
})
export class TableDemoComponent implements AfterViewInit {
  protected readonly displayedColumns = ['name', 'email', 'role', 'status', 'createdAt', 'actions'];
  protected readonly dataSource = new MatTableDataSource<UserRow>(MOCK_USERS);
  protected filter = '';

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private readonly dialog: MatDialog,
    private readonly snackbar: MatSnackBar,
  ) {}

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  protected applyFilter(value: string): void {
    this.dataSource.filter = value.trim().toLowerCase();
  }

  /** 删除行 —— 走 Material 确认弹窗，演示"表格 + 弹窗"联动 */
  protected deleteRow(row: UserRow): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '380px',
      data: {
        title: '删除确认',
        message: `确定要删除用户「${row.name}」吗？该操作不可撤销。`,
      },
    });
    ref.afterClosed().subscribe((ok: boolean | undefined) => {
      if (ok) {
        this.dataSource.data = this.dataSource.data.filter((u) => u.id !== row.id);
        this.snackbar.open(`已删除用户「${row.name}」`, '关闭', { duration: 2500 });
      }
    });
  }

  protected statusLabel(s: UserStatus): string {
    return s === 'active' ? '正常' : s === 'pending' ? '待审核' : '已封禁';
  }
}
