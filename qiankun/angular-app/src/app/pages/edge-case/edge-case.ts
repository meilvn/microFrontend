import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';

import { MaterialModule } from '../../material.module';
import { EdgeCaseService } from '../../services/edge-case.service';

interface HttpProbeResult {
  url: string;
  status: number;
  body: unknown;
}

@Component({
  selector: 'app-edge-case',
  imports: [MaterialModule],
  templateUrl: './edge-case.html',
  styleUrl: './edge-case.scss',
})
export class EdgeCaseComponent {
  // 字段按声明顺序初始化，edge 必须在 state$ 之前声明
  protected readonly edge = inject(EdgeCaseService);
  protected readonly state$ = this.edge.state$;

  protected httpProbe: HttpProbeResult | null = null;
  protected httpLoading = false;
  protected dynamicResult: string | null = null;

  private readonly http = inject(HttpClient);

  /** 相对路径请求 —— 测试 qiankun 下 <base href> / 资源前缀的影响 */
  protected runHttpProbe(): void {
    this.httpLoading = true;
    this.httpProbe = null;
    const url = 'assets/mock.json';
    this.http.get<unknown>(url).subscribe({
      next: (body) => {
        this.httpProbe = { url, status: 200, body };
        this.httpLoading = false;
      },
      error: (err) => {
        this.httpProbe = { url, status: err.status ?? 0, body: err.message ?? String(err) };
        this.httpLoading = false;
      },
    });
  }

  /** 动态 import —— 测试 qiankun 下按需 chunk 的加载 */
  protected async runDynamicImport(): Promise<void> {
    const mod = await import('../../dynamic/hello');
    this.dynamicResult = mod.helloFromDynamicChunk();
  }
}
