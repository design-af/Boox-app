package af.design.boox;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.RectF;
import android.view.View;

/**
 * The Aside Transcribe floating button: a circle with the "wave into text" glyph (two voice bars
 * becoming two lines of text). Idle = white disc, thin ring, black glyph. Recording = black disc,
 * white glyph. Panel open = heavy ring (and an inner ring when also recording).
 */
public class AsideBubbleView extends View {

    private boolean recording;
    private boolean panelOpen;
    private final Paint fill = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint ring = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Path glyph = new Path();
    private final Path scaled = new Path();
    private final Matrix m = new Matrix();

    public AsideBubbleView(Context c) {
        super(c);
        ring.setStyle(Paint.Style.STROKE);
        buildGlyph(glyph);
        setContentDescription("Aside Transcribe");
    }

    /** The glyph in a 100 x 100 box (same geometry as the logo). */
    static void buildGlyph(Path p) {
        p.reset();
        p.addRoundRect(new RectF(15, 33, 27, 67), 6, 6, Path.Direction.CW);
        p.addRoundRect(new RectF(32, 22, 44, 78), 6, 6, Path.Direction.CW);
        p.addRoundRect(new RectF(50, 34, 85, 46), 6, 6, Path.Direction.CW);
        p.addRoundRect(new RectF(50, 54, 73, 66), 6, 6, Path.Direction.CW);
    }

    void setState(boolean recording, boolean panelOpen) {
        if (this.recording == recording && this.panelOpen == panelOpen) return;
        this.recording = recording;
        this.panelOpen = panelOpen;
        setContentDescription("Aside Transcribe" + (recording ? ", recording" : "") + (panelOpen ? ", panel open" : ""));
        invalidate();
    }

    private float dp(float v) {
        return v * getResources().getDisplayMetrics().density;
    }

    @Override
    protected void onDraw(Canvas canvas) {
        float w = getWidth(), h = getHeight();
        float size = Math.min(w, h);
        float cx = w / 2f, cy = h / 2f;
        float r = size / 2f;

        fill.setStyle(Paint.Style.FILL);
        fill.setColor(recording ? Color.BLACK : Color.WHITE);
        canvas.drawCircle(cx, cy, r, fill);

        float stroke = dp(panelOpen && !recording ? 7 : 3);
        ring.setColor(Color.BLACK);
        ring.setStrokeWidth(stroke);
        canvas.drawCircle(cx, cy, r - stroke / 2f, ring);
        if (panelOpen && recording) {
            ring.setColor(Color.WHITE);
            ring.setStrokeWidth(dp(2.5f));
            canvas.drawCircle(cx, cy, r - dp(6), ring);
        }

        float g = size * 0.86f;
        m.reset();
        m.setScale(g / 100f, g / 100f);
        m.postTranslate(cx - g / 2f, cy - g / 2f);
        glyph.transform(m, scaled);
        fill.setColor(recording ? Color.WHITE : Color.BLACK);
        canvas.drawPath(scaled, fill);
    }
}
