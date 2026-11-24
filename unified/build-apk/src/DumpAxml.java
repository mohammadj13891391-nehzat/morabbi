import android.content.res.AXmlResourceParser;
import android.content.res.XmlResourceParser;
import java.io.FileInputStream;
import java.io.InputStream;

public class DumpAxml {
    public static void main(String[] args) throws Exception {
        String path = args[0];
        InputStream in = new FileInputStream(path);
        AXmlResourceParser p = new AXmlResourceParser(in);
        int depth = 0;
        int type = p.getType();
        while (type != XmlResourceParser.END_DOCUMENT) {
            if (type == XmlResourceParser.START_TAG) {
                String ns = p.getName();
                StringBuilder sb = new StringBuilder();
                for (int i = 0; i < depth; i++) sb.append("  ");
                int count = p.getAttributeCount();
                sb.append("<").append(ns);
                for (int i = 0; i < count; i++) {
                    sb.append(" ").append(p.getAttributeName(i)).append("=\"").append(p.getAttributeValue(i)).append("\"");
                }
                sb.append(">");
                System.out.println(sb);
                depth++;
            } else if (type == XmlResourceParser.END_TAG) {
                depth--;
                StringBuilder sb = new StringBuilder();
                for (int i = 0; i < depth; i++) sb.append("  ");
                sb.append("</").append(p.getName()).append(">");
                System.out.println(sb);
            } else if (type == XmlResourceParser.TEXT) {
                System.out.println("  TEXT: " + p.getText());
            }
            type = p.next();
        }
        p.close();
        System.out.println("OK: parsed successfully");
    }
}
