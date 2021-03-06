import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component,
} from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { DetectedBarcode, IBarcodeDetector } from '../../core/models';

declare const BarcodeDetector: {
  prototype: IBarcodeDetector;
  new(): IBarcodeDetector;
  getSupportedFormats(): Promise<string[]>;
};

@Component({
  selector: 'app-barcode',
  templateUrl: './barcode.page.html',
  styleUrls: ['./barcode.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BarcodePage {
  public isSupported = ('BarcodeDetector' in window);
  public errorMessage = '';
  public pictureSafeUrl: SafeUrl | null = null;
  public supportedFormats: string[] = [];
  public detectedBarcodes: DetectedBarcode[] = [];

  private pictureUrl: string | null = null;

  constructor(private cdr: ChangeDetectorRef, private sanitizer: DomSanitizer) {
    if (this.isSupported) {
      BarcodeDetector.getSupportedFormats()
        .then((formats) => {
          this.supportedFormats = formats;
          if (formats.length === 0) {
            this.errorMessage = 'Your browser doesn not support any barcode formats.';
          }
          this.cdr.markForCheck();
        })
        .catch((error) => {
          if (error instanceof Error) {
            this.errorMessage = error.message;
          } else if (typeof error === 'string') {
            this.errorMessage = error;
          }
          this.cdr.markForCheck();
        });
    }
  }

  public async onImageChange(event: Event): Promise<void> {
    this.detectedBarcodes = [];
    this.errorMessage = '';

    if (this.pictureUrl && this.pictureSafeUrl) {
      this.pictureSafeUrl = null;
      URL.revokeObjectURL(this.pictureUrl);
      this.pictureUrl = null;
    }

    this.cdr.markForCheck();

    const ionInput = event.target as HTMLElement;
    const { files } = ionInput.childNodes.item(0) as HTMLInputElement;
    if (files && files.length > 0) {
      const detector = new BarcodeDetector();
      const imageFile = files[0];
      const image = await window.createImageBitmap(imageFile);

      this.pictureUrl = URL.createObjectURL(imageFile);
      this.pictureSafeUrl = this.sanitizer.bypassSecurityTrustUrl(this.pictureUrl);
      this.detectedBarcodes = await detector.detect(image);

      if (this.detectedBarcodes.length === 0) {
        this.errorMessage = 'No barcodes detected.';
      }

      this.cdr.markForCheck();
    }
  }
}
