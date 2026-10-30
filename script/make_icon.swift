import AppKit
let target = CommandLine.arguments[1]
let manager = FileManager.default
try manager.createDirectory(atPath: target, withIntermediateDirectories: true)
for size in [16, 32, 128, 256, 512] {
    for scale in [1, 2] {
        let px = size * scale
        let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: px, pixelsHigh: px, bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
        NSGraphicsContext.saveGraphicsState(); NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
        let factor = CGFloat(px) / 1024; let transform = NSAffineTransform(); transform.scale(by: factor); transform.concat()
        NSColor(calibratedRed: 0.11, green: 0.15, blue: 0.15, alpha: 1).setFill()
        NSBezierPath(roundedRect: NSRect(x: 45, y: 45, width: 934, height: 934), xRadius: 208, yRadius: 208).fill()
        let shape = NSBezierPath(); shape.move(to: NSPoint(x: 240, y: 300)); shape.line(to: NSPoint(x: 485, y: 766)); shape.line(to: NSPoint(x: 620, y: 766)); shape.line(to: NSPoint(x: 375, y: 300)); shape.close()
        NSColor(calibratedRed: 0.72, green: 0.9, blue: 0.73, alpha: 1).setFill(); shape.fill()
        let right = NSBezierPath(); right.move(to: NSPoint(x: 468, y: 300)); right.line(to: NSPoint(x: 680, y: 710)); right.line(to: NSPoint(x: 790, y: 493)); right.line(to: NSPoint(x: 691, y: 300)); right.close(); right.fill()
        NSGraphicsContext.restoreGraphicsState()
        let suffix = scale == 2 ? "@2x" : ""
        try rep.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: target + "/icon_\(size)x\(size)\(suffix).png"))
    }
}
