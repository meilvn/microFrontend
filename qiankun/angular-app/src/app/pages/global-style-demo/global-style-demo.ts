import { Component } from '@angular/core';
import { MaterialModule } from '../../material.module';

@Component({
  selector: 'app-global-style-demo',
  imports: [MaterialModule],
  templateUrl: './global-style-demo.html',
  styleUrl: './global-style-demo.scss',
})
export class GlobalStyleDemoComponent {
  protected readonly sectionTitle = '全局选择器测试';
}
