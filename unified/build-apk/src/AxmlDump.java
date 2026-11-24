import java.io.ByteArrayOutputStream;
import java.io.FileInputStream;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

/** Correct AXML parser (plain JDK) — advances by each chunk's own size field. */
public class AxmlDump {
    static byte[] buf;
    static int p;
    static int u16() { int v = (buf[p] & 0xFF) | ((buf[p + 1] & 0xFF) << 8); p += 2; return v; }
    static int u32() { int v = (buf[p] & 0xFF) | ((buf[p + 1] & 0xFF) << 8) | ((buf[p + 2] & 0xFF) << 16) | ((buf[p + 3] & 0xFF) << 24); p += 4; return v; }

    static List<String> strings = new ArrayList<>();

    public static void main(String[] args) throws Exception {
        InputStream in = new FileInputStream(args[0]);
        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        int c;
        while ((c = in.read()) != -1) bos.write(c);
        buf = bos.toByteArray();
        in.close();

        int type = u16();
        int headerSize = u16();
        int size = u32();
        System.out.println("top: type=0x" + Integer.toHexString(type) + " headerSize=" + headerSize + " size=" + size + " (actual " + buf.length + ")");
        if (type != 0x0003) System.out.println("WARN: not RES_XML_TYPE(0x0003)");

        int depth = 0;
        boolean poolSeen = false;
        while (p < buf.length) {
            int chunkStart = p;
            int ct = u16();
            int chs = u16();
            int csz = u32();
            if (ct == 0x0001) {
                int sc = u32(); int stc = u32(); int flags = u32(); int ss = u32(); int sts = u32();
                int[] off = new int[sc];
                for (int i = 0; i < sc; i++) off[i] = u32();
                int region = chunkStart + ss;
                for (int i = 0; i < sc; i++) {
                    int s = region + off[i];
                    int cc = u16At(s);
                    StringBuilder sb = new StringBuilder();
                    for (int k = 0; k < cc; k++) sb.append((char) u16At(s + 2 + k * 2));
                    strings.add(sb.toString());
                }
                poolSeen = true;
                System.out.println("POOL: " + sc + " strings, flags=0x" + Integer.toHexString(flags));
            } else if (ct == 0x0100 || ct == 0x0101) {
                u32(); u32();
                int prefix = u32(); int uri = u32();
                System.out.println(indent(depth) + (ct == 0x0100 ? "START-NS " : "END-NS ") + str(prefix) + " -> " + str(uri));
            } else if (ct == 0x0102) {
                u32(); u32();
                int ns = u32(); int name = u32();
                int aStart = u16(); int aSize = u16(); int aCount = u16();
                u16(); u16(); u16(); // id, class, style
                StringBuilder sb = new StringBuilder();
                sb.append(indent(depth)).append("<").append(str(name));
                for (int i = 0; i < aCount; i++) {
                    int ans = u32(); int aname = u32(); int raw = u32();
                    int vsize = u16(); int dtype = buf[p] & 0xFF; p += 1; p += 1; // data1
                    int data = u32();
                    String val = (dtype == 3) ? str(data) : ("data=0x" + Integer.toHexString(data) + "(dt" + dtype + ")");
                    sb.append(" ").append(str(aname)).append("=\"").append(val).append("\"");
                }
                sb.append(">");
                System.out.println(sb);
                depth++;
            } else if (ct == 0x0103) {
                u32(); u32();
                int ns = u32(); int name = u32();
                depth--;
                System.out.println(indent(depth) + "</" + str(name) + ">");
            } else {
                System.out.println("UNKNOWN chunk 0x" + Integer.toHexString(ct) + " at " + chunkStart);
            }
            p = chunkStart + csz;
        }
        System.out.println("STRINGS (" + strings.size() + "):");
        for (int i = 0; i < strings.size(); i++) System.out.println("  [" + i + "] " + strings.get(i));
        System.out.println("OK poolSeen=" + poolSeen + " end p=" + p + " len=" + buf.length);
    }

    static int u16At(int s) { return (buf[s] & 0xFF) | ((buf[s + 1] & 0xFF) << 8); }
    static int u32At(int s) { return (buf[s] & 0xFF) | ((buf[s + 1] & 0xFF) << 8) | ((buf[s + 2] & 0xFF) << 16) | ((buf[s + 3] & 0xFF) << 24); }
    static String str(int idx) { if (idx < 0 || idx >= strings.size()) return "<idx" + idx + ">"; return strings.get(idx); }
    static String indent(int d) { StringBuilder s = new StringBuilder(); for (int i = 0; i < d; i++) s.append("  "); return s.toString(); }
}
