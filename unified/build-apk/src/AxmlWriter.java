import java.io.ByteArrayOutputStream;
import java.io.FileOutputStream;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Minimal binary AXML (Android binary XML) writer, little-endian.
 * Self-contained (no android.* deps). Emits a valid AndroidManifest.xml
 * for a resource-less APK.
 */
public class AxmlWriter {

    private static final int NO_INDEX = -1; // 0xFFFFFFFF when written

    // ---- record model ----
    private static final int NS_OPEN = 0, NS_CLOSE = 1, EL_START = 2, EL_END = 3;
    private static class Rec {
        int kind;
        String ns, name;      // EL: element ns+name ; NS: prefix, uri
        List<Attr> attrs;
    }
    private static class Attr {
        String ns, name, value;
    }

    private final List<Rec> recs = new ArrayList<>();
    private final Deque<Rec> elStack = new ArrayDeque<>();

    private void nsOpen(String prefix, String uri) {
        Rec r = new Rec(); r.kind = NS_OPEN; r.ns = prefix; r.name = uri;
        recs.add(r);
    }
    private void nsClose(String prefix, String uri) {
        Rec r = new Rec(); r.kind = NS_CLOSE; r.ns = prefix; r.name = uri;
        recs.add(r);
    }
    private void elStart(String ns, String name) {
        Rec r = new Rec(); r.kind = EL_START; r.ns = ns; r.name = name;
        r.attrs = new ArrayList<>();
        elStack.push(r);
        recs.add(r);
    }
    private void elAttr(String ns, String name, String value) {
        Attr a = new Attr(); a.ns = ns; a.name = name; a.value = value;
        elStack.peek().attrs.add(a);
    }
    private void elEnd() {
        Rec started = elStack.pop();
        Rec r = new Rec(); r.kind = EL_END; r.ns = started.ns; r.name = started.name;
        recs.add(r);
    }

    // ---- string pool (dedup, ordered by first use) ----
    private final Map<String, Integer> stringIndex = new LinkedHashMap<>();

    private int addString(String s) {
        Integer i = stringIndex.get(s);
        if (i != null) return i;
        int idx = stringIndex.size();
        stringIndex.put(s, idx);
        return idx;
    }

    private void registerAllStrings() {
        for (Rec r : recs) {
            if (r.kind == NS_OPEN || r.kind == NS_CLOSE) {
                addString(r.ns);      // prefix
                addString(r.name);    // uri
            } else if (r.kind == EL_START) {
                if (r.ns != null) addString(r.ns);
                addString(r.name);
                for (Attr a : r.attrs) {
                    if (a.ns != null) addString(a.ns);
                    addString(a.name);
                    addString(a.value);
                    addString(a.value); // rawValue + data reference same string
                }
            } else if (r.kind == EL_END) {
                if (r.ns != null) addString(r.ns);
                addString(r.name);
            }
        }
    }

    private byte[] buildStringPool() {
        int n = stringIndex.size();
        int stringsStart = 28 + n * 4;
        ByteArrayOutputStream sdata = new ByteArrayOutputStream();
        int[] offsets = new int[n];
        int pos = 0;
        int i = 0;
        for (Map.Entry<String, Integer> e : stringIndex.entrySet()) {
            String s = e.getKey();
            char[] c = s.toCharArray();
            offsets[i] = pos;
            sdata.write(c.length & 0xFF); sdata.write((c.length >> 8) & 0xFF); pos += 2; // uint16 charCount
            for (char ch : c) { pos += 2; sdata.write(ch & 0xFF); sdata.write((ch >> 8) & 0xFF); }
            sdata.write(0); sdata.write(0); pos += 2; // null terminator
            i++;
        }
        int totalSize = stringsStart + pos;
        ByteArrayOutputStream b = new ByteArrayOutputStream();
        u16(b, 0x0001); u16(b, 28); u32(b, totalSize);
        u32(b, n); u32(b, 0);          // stringCount, styleCount
        u32(b, 0);                      // flags (UTF-16)
        u32(b, stringsStart); u32(b, 0);
        for (int k = 0; k < n; k++) u32(b, offsets[k]);
        b.write(sdata.toByteArray(), 0, sdata.size());
        return b.toByteArray();
    }

    private void buildTree(ByteArrayOutputStream tree) {
        for (Rec r : recs) {
            if (r.kind == NS_OPEN || r.kind == NS_CLOSE) {
                int type = (r.kind == NS_OPEN) ? 0x0100 : 0x0101;
                int pIdx = addString(r.ns);
                int uIdx = addString(r.name);
                ByteArrayOutputStream b = new ByteArrayOutputStream();
                u16(b, type); u16(b, 16); u32(b, 24);
                u32(b, 0); u32(b, 0);               // lineNumber, comment
                u32(b, pIdx & 0xFFFFFFFFL);
                u32(b, uIdx & 0xFFFFFFFFL);
                writeAll(tree, b);
            } else if (r.kind == EL_START) {
                int aCount = r.attrs.size();
                long size = 36 + (long) aCount * 20;
                ByteArrayOutputStream b = new ByteArrayOutputStream();
                u16(b, 0x0102); u16(b, 16); u32(b, size);
                u32(b, 0); u32(b, 0);               // lineNumber, comment
                u32(b, (r.ns == null ? NO_INDEX : addString(r.ns)) & 0xFFFFFFFFL);
                u32(b, addString(r.name) & 0xFFFFFFFFL);
                u16(b, 36); u16(b, 20); u16(b, aCount); // attributeStart, attributeSize, attributeCount
                u16(b, 0); u16(b, 0); u16(b, 0);    // idIndex, classIndex, styleIndex
                for (Attr a : r.attrs) {
                    u32(b, (a.ns == null ? NO_INDEX : addString(a.ns)) & 0xFFFFFFFFL);
                    u32(b, addString(a.name) & 0xFFFFFFFFL);
                    int val = addString(a.value);
                    u32(b, val & 0xFFFFFFFFL);      // rawValue
                    b.write(8); b.write(0);          // size (u16 = 8)
                    b.write(3);                      // dataType TYPE_STRING
                    b.write(0);                      // data1
                    u32(b, val & 0xFFFFFFFFL);       // data
                }
                writeAll(tree, b);
            } else if (r.kind == EL_END) {
                ByteArrayOutputStream b = new ByteArrayOutputStream();
                u16(b, 0x0103); u16(b, 16); u32(b, 24);
                u32(b, 0); u32(b, 0);               // lineNumber, comment
                u32(b, (r.ns == null ? NO_INDEX : addString(r.ns)) & 0xFFFFFFFFL);
                u32(b, addString(r.name) & 0xFFFFFFFFL);
                writeAll(tree, b);
            }
        }
    }

    private void writeAll(ByteArrayOutputStream to, ByteArrayOutputStream from) {
        byte[] d = from.toByteArray();
        to.write(d, 0, d.length);
    }

    public byte[] finish() {
        registerAllStrings();          // pass 1: finalize the pool
        byte[] pool = buildStringPool();
        // NOTE: buildTree calls addString again (dedup) -> same indices.
        ByteArrayOutputStream tree = new ByteArrayOutputStream();
        buildTree(tree);
        int total = 8 + pool.length + tree.size();
        ByteArrayOutputStream res = new ByteArrayOutputStream();
        u16(res, 0x0003); u16(res, 8); u32(res, total);
        res.write(pool, 0, pool.length);
        res.write(tree.toByteArray(), 0, tree.size());
        return res.toByteArray();
    }

    private void u16(ByteArrayOutputStream b, int v) { b.write(v & 0xFF); b.write((v >> 8) & 0xFF); }
    private void u32(ByteArrayOutputStream b, long v) {
        b.write((int) (v & 0xFF)); b.write((int) ((v >> 8) & 0xFF));
        b.write((int) ((v >> 16) & 0xFF)); b.write((int) ((v >> 24) & 0xFF));
    }

    public static void main(String[] args) throws Exception {
        String androidNs = "http://schemas.android.com/apk/res/android";
        AxmlWriter w = new AxmlWriter();
        w.nsOpen("android", androidNs);

        w.elStart(null, "manifest");
        w.elAttr(null, "package", "ir.nehzat.morabbi");

        w.elStart(null, "uses-permission");
        w.elAttr(androidNs, "name", "android.permission.INTERNET");
        w.elEnd();

        w.elStart(null, "uses-permission");
        w.elAttr(androidNs, "name", "android.permission.ACCESS_NETWORK_STATE");
        w.elEnd();

        w.elStart(null, "application");
        w.elAttr(androidNs, "label", "Morabbi");
        w.elAttr(androidNs, "allowBackup", "true");
        w.elAttr(androidNs, "supportsRtl", "true");
        w.elAttr(androidNs, "usesCleartextTraffic", "true");

        w.elStart(null, "activity");
        w.elAttr(androidNs, "name", ".MainActivity");
        w.elAttr(androidNs, "exported", "true");

        w.elStart(null, "intent-filter");
        w.elStart(null, "action");
        w.elAttr(androidNs, "name", "android.intent.action.MAIN");
        w.elEnd();
        w.elStart(null, "category");
        w.elAttr(androidNs, "name", "android.intent.category.LAUNCHER");
        w.elEnd();
        w.elEnd(); // intent-filter
        w.elEnd(); // activity
        w.elEnd(); // application
        w.elEnd(); // manifest
        w.nsClose("android", androidNs);

        byte[] data = w.finish();
        FileOutputStream fos = new FileOutputStream(args[0]);
        fos.write(data);
        fos.flush();
        fos.close();
        System.out.println("wrote " + args[0] + " (" + data.length + " bytes)");
    }
}
