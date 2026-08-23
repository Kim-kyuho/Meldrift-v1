import { afterEach, describe, expect, it, vi } from "vitest";
import {
    fitImageSize,
    imageBytesToDataUrl,
    prepareImageFile,
} from "@/lib/image-file";

describe("local image preparation", () => {
    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it("fits image dimensions without changing the aspect ratio", () => {
        expect(fitImageSize(4000, 2000, 1920, 1920)).toEqual({ width: 1920, height: 960 });
        expect(fitImageSize(320, 200, 400, 300)).toEqual({ width: 320, height: 200 });
    });

    it("encodes image bytes as a self-contained data URL", () => {
        expect(imageBytesToDataUrl(new Uint8Array([1, 2, 3]), "image/webp"))
            .toBe("data:image/webp;base64,AQID");
        expect(imageBytesToDataUrl(new Uint8Array([255]), "image/png"))
            .toBe("data:image/png;base64,/w==");
    });

    it("rejects unsupported local image formats before decoding", async () => {
        const file = new File(["svg"], "drawing.svg", { type: "image/svg+xml" });
        await expect(prepareImageFile(file)).rejects.toThrow(/JPEG, PNG, or WebP/i);
    });

    it("resizes and encodes a selected image before returning bytes", async () => {
        const createObjectURL = vi.fn().mockReturnValue("blob:source");
        const revokeObjectURL = vi.fn();
        const NativeURL = URL;

        class MockURL extends NativeURL {
            static createObjectURL = createObjectURL;
            static revokeObjectURL = revokeObjectURL;
        }
        class MockImage {
            naturalWidth = 4000;
            naturalHeight = 2000;
            onload: (() => void) | null = null;
            onerror: (() => void) | null = null;

            set src(_value: string) {
                queueMicrotask(() => this.onload?.());
            }
        }

        vi.stubGlobal("URL", MockURL);
        vi.stubGlobal("Image", MockImage);
        const drawImage = vi.fn();
        vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
            clearRect: vi.fn(),
            drawImage,
        } as never);
        vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation((callback, type) => {
            callback(new Blob([new Uint8Array([1, 2, 3])], { type: type ?? "image/webp" }));
        });

        const result = await prepareImageFile(
            new File([new Uint8Array([9, 8, 7])], "photo.png", { type: "image/png" }),
        );

        expect(result).toEqual({
            data: new Uint8Array([1, 2, 3]),
            mimeType: "image/webp",
            label: "photo.png",
            width: 400,
            height: 200,
        });
        expect(drawImage).toHaveBeenCalledWith(expect.any(MockImage), 0, 0, 1920, 960);
        expect(revokeObjectURL).toHaveBeenCalledWith("blob:source");
    });
});
