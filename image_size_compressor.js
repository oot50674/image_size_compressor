/**
 * image-size-compressor.js
 * ------------------------------------------------------------
 * 브라우저에서 이미지 파일을 대략적인 목표 크기(KB)로 압축하는
 * 순수 자바스크립트 유틸리티입니다.
 * ------------------------------------------------------------
 *  - 외부 라이브러리 불필요
 *  - <canvas>.toBlob()을 지원하는 최신 브라우저에서 동작
 *  - JPEG/WEBP 품질에 대한 이진 탐색과 선택적 다운스케일링 사용
 *
 *  사용 예시 (ES Module 스타일):
 *  import { compressImageToTarget } from './image-size-compressor.js';
 *  const blob = await compressImageToTarget(file, {
 *      targetSizeKB: 300,
 *      mimeType: 'image/jpeg',
 *      maxWidth: 1920,
 *      maxHeight: 1080
 *  });
 *
 *  또는 <script>로 포함 후 compressImageToTarget(...) 전역 함수 사용.
 *
 *  참고: 최종 파일 크기는 일반적으로 목표값에서 ±5 KB 이내입니다.
 */

(function (global) {
  'use strict';

  /**
   * Read a File object into an HTMLImageElement
   * @param {File} file
   * @returns {Promise<HTMLImageElement>}
   */
  function loadImageFromFile(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function (evt) {
        var img = new Image();
        img.onload = function () {
          resolve(img);
        };
        img.onerror = function (err) {
          reject(err);
        };
        img.src = evt.target.result;
      };
      reader.onerror = function (err) {
        reject(err);
      };
      reader.readAsDataURL(file);
    });
  }

  /**
   * Draw image to canvas, optionally scaling down.
   * @param {HTMLImageElement} image
   * @param {number|null} maxWidth
   * @param {number|null} maxHeight
   * @param {number} downscaleRatio 1 = original, <1 = smaller
   * @returns {HTMLCanvasElement}
   */
  function drawImageToCanvas(image, maxWidth, maxHeight, downscaleRatio) {
    var canvas = document.createElement('canvas');
    var width = image.width;
    var height = image.height;

    if (typeof downscaleRatio === 'number' && downscaleRatio < 1) {
      width = Math.round(width * downscaleRatio);
      height = Math.round(height * downscaleRatio);
    }

    if (maxWidth && width > maxWidth) {
      height = Math.round(height * (maxWidth / width));
      width = maxWidth;
    }
    if (maxHeight && height > maxHeight) {
      width = Math.round(width * (maxHeight / height));
      height = maxHeight;
    }

    canvas.width = width;
    canvas.height = height;

    var ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0, width, height);
    return canvas;
  }

  /**
   * Wrap canvas.toBlob in a Promise
   * @param {HTMLCanvasElement} canvas
   * @param {string} mimeType
   * @param {number} quality 0–1
   * @returns {Promise<Blob>}
   */
  function canvasToBlob(canvas, mimeType, quality) {
    return new Promise(function (resolve) {
      canvas.toBlob(function (blob) {
        resolve(blob);
      }, mimeType, quality);
    });
  }

  /**
   * 이미지를 (대략적으로) 목표 크기로 압축합니다.
   * @param {File|Blob} file      원본 이미지 파일
   * @param {Object} options      설정 객체
   *        targetSizeKB  : number (필수) - 목표 크기(KB)
   *        mimeType      : string (기본값 'image/jpeg') - 브라우저가 지원하는 이미지 MIME (예: 'image/jpeg', 'image/webp', 'image/png', 'image/avif')
   *        maxWidth      : number | null - 최대 너비
   *        maxHeight     : number | null - 최대 높이
   *        maxIterations : number (기본값 10) - 품질 탐색 반복 횟수
   *        minQuality    : number (기본값 0.1) - 최소 품질
   *        maxQuality    : number (기본값 0.95) - 최대 품질
   *        allowScaleDown: boolean (기본값 true) - 다운스케일 허용 여부
   * @returns {Promise<Blob>}     압축된 이미지 Blob
   */

  function compressImageToTarget(file, options) {
    options = options || {};

    var targetSizeKB = options.targetSizeKB;
    if (!targetSizeKB) {
      return Promise.reject(new Error('targetSizeKB option is required.'));
    }

    var mimeType = options.mimeType || 'image/jpeg';
    var maxWidth = options.maxWidth || null;
    var maxHeight = options.maxHeight || null;
    var maxIterations = options.maxIterations || 10;
    var minQualitySetting = options.minQuality || 0.1;
    var maxQualitySetting = options.maxQuality || 0.95;
    var allowScaleDown = options.allowScaleDown !== false; // default true
    var scaleStep = 0.9; // 다운스케일 비율 (10%씩 감소)

    // 1. 파일을 이미지로 로드
    return loadImageFromFile(file).then(function (img) {
      var downscaleRatio = 1.0;

      // 압축 시도 함수 (재귀적으로 다운스케일링 및 품질 탐색)
      function attemptCompression() {
        // 2. 이미지(다운스케일 적용)를 canvas에 그림
        var canvas = drawImageToCanvas(img, maxWidth, maxHeight, downscaleRatio);

        // 3. 품질 이진 탐색
        var low = minQualitySetting;
        var high = maxQualitySetting;
        var currentQuality = high;
        var iteration = 0;
        var bestBlob = null;

        // 품질 이진 탐색 함수
        function binarySearch() {
          return canvasToBlob(canvas, mimeType, currentQuality).then(function (blob) {
            var sizeKB = blob.size / 1024;

            // 목표 크기 이하이면 bestBlob 갱신, 품질 높여보기
            if (sizeKB <= targetSizeKB) {
              bestBlob = blob;
              low = currentQuality;
            } else {
              // 목표 크기 초과면 품질 낮춤
              high = currentQuality;
            }

            iteration += 1;
            // 반복 종료 조건: 최대 반복 또는 오차 5KB 이내
            if (iteration >= maxIterations || Math.abs(sizeKB - targetSizeKB) <= 5) {
              return bestBlob || blob;
            }

            // 품질값 갱신 후 재귀
            currentQuality = (low + high) / 2;
            return binarySearch();
          });
        }

        // 4. 품질로도 부족하면 다운스케일링 후 재시도
        return binarySearch().then(function (blobResult) {
          var finalSizeKB = blobResult.size / 1024;

          // 목표 크기보다 많이 크고, 다운스케일 허용 시, 이미지 크기 줄여 재시도
          if (finalSizeKB > targetSizeKB + 5 && allowScaleDown && downscaleRatio > 0.25) {
            downscaleRatio *= scaleStep;
            return attemptCompression();
          }
          // 최종 Blob 반환
          return blobResult;
        });
      }

      // 최초 압축 시도 시작
      return attemptCompression();
    });
  }

  // UMD export pattern
  if (typeof exports === 'object' && typeof module !== 'undefined') {
    module.exports = {
      compressImageToTarget: compressImageToTarget
    };
  } else if (typeof define === 'function' && define.amd) {
    define(function () {
      return { compressImageToTarget: compressImageToTarget };
    });
  } else {
    global.compressImageToTarget = compressImageToTarget;
  }

}(this));
