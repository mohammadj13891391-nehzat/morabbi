import com.android.internal.util.FastXmlSerializer;
import org.xmlpull.v1.XmlSerializer;
import java.io.File;
import java.io.FileOutputStream;

public class MakeManifest {
    static final String ANDROID_NS = "http://schemas.android.com/apk/res/android";

    public static void main(String[] args) throws Exception {
        File out = new File(args[0]);
        FileOutputStream fos = new FileOutputStream(out);
        XmlSerializer ser = new FastXmlSerializer();
        ser.startDocument("UTF-8", true);

        ser.startTag(null, "manifest");
        ser.attribute(null, "package", "ir.nehzat.morabbi");

        ser.startTag(null, "uses-permission");
        ser.attribute(ANDROID_NS, "name", "android.permission.INTERNET");
        ser.endTag(null, "uses-permission");

        ser.startTag(null, "uses-permission");
        ser.attribute(ANDROID_NS, "name", "android.permission.ACCESS_NETWORK_STATE");
        ser.endTag(null, "uses-permission");

        ser.startTag(null, "application");
        ser.attribute(ANDROID_NS, "label", "Morabbi");
        ser.attribute(ANDROID_NS, "allowBackup", "true");
        ser.attribute(ANDROID_NS, "supportsRtl", "true");
        ser.attribute(ANDROID_NS, "usesCleartextTraffic", "true");

        ser.startTag(null, "activity");
        ser.attribute(ANDROID_NS, "name", ".MainActivity");
        ser.attribute(ANDROID_NS, "exported", "true");

        ser.startTag(null, "intent-filter");
        ser.startTag(null, "action");
        ser.attribute(ANDROID_NS, "name", "android.intent.action.MAIN");
        ser.endTag(null, "action");
        ser.startTag(null, "category");
        ser.attribute(ANDROID_NS, "name", "android.intent.category.LAUNCHER");
        ser.endTag(null, "category");
        ser.endTag(null, "intent-filter");

        ser.endTag(null, "activity");
        ser.endTag(null, "application");
        ser.endTag(null, "manifest");

        ser.endDocument();
        ser.flush();
        fos.flush();
        fos.close();
        System.out.println("wrote " + out.getAbsolutePath() + " (" + out.length() + " bytes)");
    }
}
