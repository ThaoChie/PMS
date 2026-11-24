package com.pms.backend.util;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.streaming.SXSSFSheet;
import org.apache.poi.xssf.usermodel.DefaultIndexedColorMap;
import org.apache.poi.xssf.usermodel.XSSFCellStyle;
import org.apache.poi.xssf.usermodel.XSSFColor;
import org.apache.poi.xssf.usermodel.XSSFFont;

import java.awt.Color;

/**
 * Utility class providing professional Excel styling and formatting with Times New Roman.
 * Guarantees proper row heights, generous column widths, padding, borders, and typography.
 */
public class ExcelStyleHelper {

    public static final String FONT_NAME = "Times New Roman";

    // Standard Row Heights (in points)
    public static final float TITLE_ROW_HEIGHT = 36.0f;
    public static final float SECTION_ROW_HEIGHT = 28.0f;
    public static final float HEADER_ROW_HEIGHT = 28.0f;
    public static final float DATA_ROW_HEIGHT = 24.0f;
    public static final float INFO_ROW_HEIGHT = 23.0f;
    public static final float SPACER_ROW_HEIGHT = 14.0f;

    // Palette Colors
    public static final Color COLOR_HEADER_BG = new Color(31, 78, 120);       // Dark Navy #1F4E78
    public static final Color COLOR_ZEBRA_BG = new Color(245, 248, 252);      // Subtle Blue-Gray Tint #F5F8FC
    public static final Color COLOR_WHITE_BG = new Color(255, 255, 255);      // Pure White #FFFFFF
    public static final Color COLOR_INFO_LABEL_BG = new Color(241, 245, 249); // Neutral Slate Light #F1F5F9
    public static final Color COLOR_BORDER = new Color(209, 213, 219);        // Soft Gray #D1D5DB
    public static final Color COLOR_TITLE_TEXT = new Color(31, 78, 120);      // Dark Navy Text

    private final Workbook workbook;
    private final DefaultIndexedColorMap colorMap;

    // Cached Styles
    private CellStyle titleStyle;
    private CellStyle sectionHeaderStyle;
    private CellStyle headerCenterStyle;
    private CellStyle headerLeftStyle;
    private CellStyle headerRightStyle;

    private CellStyle infoLabelStyle;
    private CellStyle infoValueStyle;

    // Regular Data Styles (White Background)
    private CellStyle dataLeftRegular;
    private CellStyle dataCenterRegular;
    private CellStyle dataRightRegular;
    private CellStyle dataDecimalRegular;
    private CellStyle dataIntegerRegular;

    // Zebra Data Styles (Soft Tint Background)
    private CellStyle dataLeftZebra;
    private CellStyle dataCenterZebra;
    private CellStyle dataRightZebra;
    private CellStyle dataDecimalZebra;
    private CellStyle dataIntegerZebra;

    public ExcelStyleHelper(Workbook workbook) {
        this.workbook = workbook;
        this.colorMap = new DefaultIndexedColorMap();
        initStyles();
    }

    private void initStyles() {
        DataFormat dataFormat = workbook.createDataFormat();
        short decimalFormat = dataFormat.getFormat("#,##0.0");
        short integerFormat = dataFormat.getFormat("#,##0");

        // 1. Title Style
        Font titleFont = createFont(16, true, COLOR_TITLE_TEXT);
        titleStyle = workbook.createCellStyle();
        titleStyle.setFont(titleFont);
        titleStyle.setAlignment(HorizontalAlignment.LEFT);
        titleStyle.setVerticalAlignment(VerticalAlignment.CENTER);

        // 2. Section Header Style (e.g. for subtitles / section banners)
        Font sectionFont = createFont(12, true, COLOR_TITLE_TEXT);
        sectionHeaderStyle = workbook.createCellStyle();
        sectionHeaderStyle.setFont(sectionFont);
        sectionHeaderStyle.setAlignment(HorizontalAlignment.LEFT);
        sectionHeaderStyle.setVerticalAlignment(VerticalAlignment.CENTER);

        // 3. Table Header Styles
        Font headerFont = createFont(11, true, Color.WHITE);
        headerCenterStyle = createBaseHeaderStyle(headerFont, HorizontalAlignment.CENTER);
        headerLeftStyle = createBaseHeaderStyle(headerFont, HorizontalAlignment.LEFT);
        headerRightStyle = createBaseHeaderStyle(headerFont, HorizontalAlignment.RIGHT);

        // 4. Info Row Styles (Sheet 1 Key-Value metadata)
        Font infoLabelFont = createFont(11, true, new Color(55, 65, 81));
        infoLabelStyle = createStyledCell(infoLabelFont, HorizontalAlignment.LEFT, COLOR_INFO_LABEL_BG, false, (short) 0);

        Font infoValueFont = createFont(11, false, Color.BLACK);
        infoValueStyle = createStyledCell(infoValueFont, HorizontalAlignment.LEFT, COLOR_WHITE_BG, false, (short) 0);

        // 5. Data Styles
        Font dataRegularFont = createFont(11, false, Color.BLACK);

        dataLeftRegular = createStyledCell(dataRegularFont, HorizontalAlignment.LEFT, COLOR_WHITE_BG, true, (short) 0);
        dataCenterRegular = createStyledCell(dataRegularFont, HorizontalAlignment.CENTER, COLOR_WHITE_BG, false, (short) 0);
        dataRightRegular = createStyledCell(dataRegularFont, HorizontalAlignment.RIGHT, COLOR_WHITE_BG, false, (short) 0);
        dataDecimalRegular = createStyledCell(dataRegularFont, HorizontalAlignment.RIGHT, COLOR_WHITE_BG, false, decimalFormat);
        dataIntegerRegular = createStyledCell(dataRegularFont, HorizontalAlignment.RIGHT, COLOR_WHITE_BG, false, integerFormat);

        dataLeftZebra = createStyledCell(dataRegularFont, HorizontalAlignment.LEFT, COLOR_ZEBRA_BG, true, (short) 0);
        dataCenterZebra = createStyledCell(dataRegularFont, HorizontalAlignment.CENTER, COLOR_ZEBRA_BG, false, (short) 0);
        dataRightZebra = createStyledCell(dataRegularFont, HorizontalAlignment.RIGHT, COLOR_ZEBRA_BG, false, (short) 0);
        dataDecimalZebra = createStyledCell(dataRegularFont, HorizontalAlignment.RIGHT, COLOR_ZEBRA_BG, false, decimalFormat);
        dataIntegerZebra = createStyledCell(dataRegularFont, HorizontalAlignment.RIGHT, COLOR_ZEBRA_BG, false, integerFormat);
    }

    private Font createFont(int sizePoints, boolean bold, Color color) {
        Font font = workbook.createFont();
        font.setFontName(FONT_NAME);
        font.setFontHeightInPoints((short) sizePoints);
        font.setBold(bold);
        if (font instanceof XSSFFont xssfFont && color != null) {
            xssfFont.setColor(new XSSFColor(color, colorMap));
        }
        return font;
    }

    private CellStyle createBaseHeaderStyle(Font font, HorizontalAlignment align) {
        CellStyle style = workbook.createCellStyle();
        style.setFont(font);
        style.setAlignment(align);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        style.setWrapText(true);

        applyFillColor(style, COLOR_HEADER_BG);
        applyBorders(style, BorderStyle.THIN, COLOR_BORDER);
        return style;
    }

    private CellStyle createStyledCell(Font font, HorizontalAlignment align, Color bg, boolean wrap, short dataFormat) {
        CellStyle style = workbook.createCellStyle();
        style.setFont(font);
        style.setAlignment(align);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        style.setWrapText(wrap);

        if (dataFormat > 0) {
            style.setDataFormat(dataFormat);
        }

        applyFillColor(style, bg);
        applyBorders(style, BorderStyle.THIN, COLOR_BORDER);
        return style;
    }

    private void applyFillColor(CellStyle style, Color bg) {
        if (bg != null) {
            if (style instanceof XSSFCellStyle xssfStyle) {
                xssfStyle.setFillForegroundColor(new XSSFColor(bg, colorMap));
            } else {
                style.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            }
            style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        }
    }

    private void applyBorders(CellStyle style, BorderStyle borderStyle, Color borderColor) {
        style.setBorderTop(borderStyle);
        style.setBorderBottom(borderStyle);
        style.setBorderLeft(borderStyle);
        style.setBorderRight(borderStyle);

        if (style instanceof XSSFCellStyle xssfStyle && borderColor != null) {
            XSSFColor xc = new XSSFColor(borderColor, colorMap);
            xssfStyle.setTopBorderColor(xc);
            xssfStyle.setBottomBorderColor(xc);
            xssfStyle.setLeftBorderColor(xc);
            xssfStyle.setRightBorderColor(xc);
        }
    }

    // Getters for cached styles
    public CellStyle getTitleStyle() { return titleStyle; }
    public CellStyle getSectionHeaderStyle() { return sectionHeaderStyle; }
    public CellStyle getHeaderCenterStyle() { return headerCenterStyle; }
    public CellStyle getHeaderLeftStyle() { return headerLeftStyle; }
    public CellStyle getHeaderRightStyle() { return headerRightStyle; }
    public CellStyle getInfoLabelStyle() { return infoLabelStyle; }
    public CellStyle getInfoValueStyle() { return infoValueStyle; }

    public CellStyle getDataLeftStyle(boolean isZebra) { return isZebra ? dataLeftZebra : dataLeftRegular; }
    public CellStyle getDataCenterStyle(boolean isZebra) { return isZebra ? dataCenterZebra : dataCenterRegular; }
    public CellStyle getDataRightStyle(boolean isZebra) { return isZebra ? dataRightZebra : dataRightRegular; }
    public CellStyle getDataDecimalStyle(boolean isZebra) { return isZebra ? dataDecimalZebra : dataDecimalRegular; }
    public CellStyle getDataIntegerStyle(boolean isZebra) { return isZebra ? dataIntegerZebra : dataIntegerRegular; }

    /**
     * Initializes sheet defaults (gridlines, column tracking if streaming).
     */
    public static void prepareSheet(Sheet sheet) {
        sheet.setDisplayGridlines(true);
        if (sheet instanceof SXSSFSheet sxssfSheet) {
            sxssfSheet.trackAllColumnsForAutoSizing();
        }
    }

    /**
     * Formats columns with custom minimum widths, maximum bound, and generous breathing padding.
     *
     * @param sheet the Sheet to format
     * @param minWidthsChars array of minimum character widths per column
     * @param maxChars maximum allowed character width for any column
     */
    public static void formatColumns(Sheet sheet, int[] minWidthsChars, int maxChars) {
        int padding = 1500; // ~6 chars padding for generous breathing room
        int maxUnits = maxChars * 256;

        for (int i = 0; i < minWidthsChars.length; i++) {
            int minUnits = minWidthsChars[i] * 256;
            try {
                sheet.autoSizeColumn(i);
                int currentWidth = sheet.getColumnWidth(i);
                int finalWidth = Math.min(Math.max(currentWidth + padding, minUnits), maxUnits);
                sheet.setColumnWidth(i, finalWidth);
            } catch (Throwable t) {
                // Fallback in headless environment without font metrics
                sheet.setColumnWidth(i, Math.min(Math.max(minUnits + padding, minUnits), maxUnits));
            }
        }
    }
}
