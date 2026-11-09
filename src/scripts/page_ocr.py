import sys
import os
import json

# Prevent pymupdf from attempting to load optional AI layout package
sys.modules['pymupdf.layout'] = None
sys.modules['pymupdf_layout'] = None

import pymupdf

def run_page_ocr(pdf_path: str, page_idx: int, tessdata_dir: str = None) -> dict:
    if not os.path.exists(pdf_path):
        return {"error": "PDF file not found", "lines": [], "words": [], "text": ""}

    if not tessdata_dir or not os.path.isdir(tessdata_dir):
        script_dir = os.path.dirname(os.path.abspath(__file__))
        cand = os.path.join(script_dir, "tessdata")
        if os.path.isdir(cand):
            tessdata_dir = cand

    doc = None
    try:
        doc = pymupdf.open(pdf_path)
        if page_idx < 0 or page_idx >= len(doc):
            return {"error": "Invalid page index", "lines": [], "words": [], "text": ""}

        page = doc[page_idx]
        raw_text = page.get_text().strip()
        words = []
        blocks = []
        text = ""

        # Check if page already has digital text (much faster & sharper)
        if len(raw_text) > 40:
            text = page.get_text()
            words = page.get_text("words")
            blocks = page.get_text("blocks")
            is_scanned = False
        else:
            is_scanned = True
            try:
                tp = page.get_textpage_ocr(tessdata=tessdata_dir, language="eng+ind", dpi=150)
                text = tp.extractText()
                words = tp.extractWORDS()
                blocks = tp.extractBLOCKS()
            except Exception as e:
                text = page.get_text()
                words = page.get_text("words")
                blocks = page.get_text("blocks")

        # Group words by (block_no, line_no) into complete sentences / lines
        lines_map = {}
        for w in words:
            if len(w) < 5:
                continue
            b_no = w[5] if len(w) > 5 else 0
            l_no = w[6] if len(w) > 6 else 0
            key = (b_no, l_no)
            if key not in lines_map:
                lines_map[key] = {
                    "x0": w[0], "y0": w[1], "x1": w[2], "y1": w[3],
                    "words": [str(w[4])],
                    "block_no": b_no,
                    "line_no": l_no
                }
            else:
                entry = lines_map[key]
                entry["x0"] = min(entry["x0"], w[0])
                entry["y0"] = min(entry["y0"], w[1])
                entry["x1"] = max(entry["x1"], w[2])
                entry["y1"] = max(entry["y1"], w[3])
                entry["words"].append(str(w[4]))

        lines_list = []
        for entry in sorted(lines_map.values(), key=lambda l: (round(l["y0"] / 6) * 6, l["x0"])):
            line_str = " ".join(entry["words"]).strip()
            if not line_str:
                continue
            lh = entry["y1"] - entry["y0"]
            f_size = max(8.0, min(36.0, round(lh * 0.82, 1)))
            lines_list.append({
                "x0": round(entry["x0"] - 1.5, 1),
                "y0": round(entry["y0"] - 1.5, 1),
                "x1": round(entry["x1"] + 2.5, 1),
                "y1": round(entry["y1"] + 1.5, 1),
                "text": line_str,
                "fontsize": f_size
            })

        words_list = []
        for w in words:
            if len(w) >= 5:
                words_list.append({
                    "x0": round(w[0], 1),
                    "y0": round(w[1], 1),
                    "x1": round(w[2], 1),
                    "y1": round(w[3], 1),
                    "word": str(w[4])
                })

        return {
            "page_index": page_idx,
            "width": round(page.rect.width, 1),
            "height": round(page.rect.height, 1),
            "is_scanned": is_scanned,
            "text": text.strip(),
            "lines": lines_list,
            "words": words_list
        }
    except Exception as e:
        return {"error": str(e), "lines": [], "words": [], "text": ""}
    finally:
        if doc:
            doc.close()

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Usage: python page_ocr.py <pdf_path> <page_idx> [tessdata_dir]"}))
        sys.exit(1)

    pdf_file = sys.argv[1]
    page_number = int(sys.argv[2])
    tess_path = sys.argv[3] if len(sys.argv) > 3 else None

    result = run_page_ocr(pdf_file, page_number, tess_path)
    print(json.dumps(result))
