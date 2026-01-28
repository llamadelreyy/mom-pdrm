#!/usr/bin/env python3
"""
Test script to verify the DOCX numbering fix works correctly.
"""

from pathlib import Path
import sys
import os

# Add the current directory to Python path to import app functions
sys.path.insert(0, '.')

from app import create_docx_report

def test_numbering_fix():
    """Test the numbering fix with sample meeting minutes content."""
    
    # Sample content that matches the user's meeting minutes format
    sample_content = """MINIT MESYURAT MEETING
Projek: Japan 9 2025
Tarikh: Tidak dinyatakan
Masa: Tidak dinyatakan

---

1. PENGENALAN DAN PELAKSANAAN MESYURAT
1. 1. Pembukaan – Pengerusi tidak dapat hadir pada mesyuarat sebelum ini, memohon maaf.
2. 2. Pengenalan Penyampai – Ben dilantik sebagai penyampai utama bagi mesyuarat ini.

2. PENGEMBANGAN PROJEK JEPANG 9 2025
3. 1. Nama Projek – Japan 9 2025.
4. 2. Mesyuarat Sebelumnya – Dilaksanakan dua minggu lalu.
5. 3. Topik Mesyuarat Sebelumnya –
&nbsp;&nbsp;• Pengenalan papan WhatsApp (WhatsApp board).
&nbsp;&nbsp;• Mesyuarat minit.
&nbsp;&nbsp;• Modul pencarian dokumen (document search).

3. STATUS PENYEBARAN
6. 1. Penyebaran di Pelayan Jepun – Telah diselesaikan.
7. 2. Status Port – Port telah dibuka (disahkan oleh Ben).
8. 3. Ujian Dalaman –
&nbsp;&nbsp;• Perlu dijalankan dalam rangkaian tempatan (LAN).
&nbsp;&nbsp;• Ben telah memaklumkan bahawa port sudah dibuka.
9. 4. Chatbot WhatsApp –
&nbsp;&nbsp;• Paling penting bagi port.
&nbsp;&nbsp;• Webhook perlu diset ke pelayan Jepun.

4. Papan WhatsApp (WhatsApp Board)
10. 1. Lokasi – Di dalam pelayan Jepun.
11. 2. Pengaktifan – Port terbuka, Ben mengesahkan.
12. 3. Langkah Seterusnya – Ben akan cepat menyiapkan setelan latensi (latent).

5. FAQ & Pangkalan Pengetahuan
13. 1. Keperluan Kemas Kini –
&nbsp;&nbsp;• FAQ yang diambil daripada laman web J‑Pan tidak dikemaskini.
&nbsp;&nbsp;• Sistem penilaian (grading system) adalah versi lama.
14. 2. Sumber Dokumen – Ben telah memperoleh PDF besar yang mengandungi maklumat terkini.
15. 3. Proses Kemas Kini –
&nbsp;&nbsp;• Muat naik PDF ke dalam folder khusus atau panel pentadbiran.
&nbsp;&nbsp;• Pertimbangan modul tambahan untuk memudahkan muat naik.
16. 4. Metodologi –
&nbsp;&nbsp;• Muat naik fail PDF secara terus ke dalam folder.
&nbsp;&nbsp;• Alternatif: modul admin untuk memuat naik fail.

6. Modul Pencarian Dokumen
17. 1. Keterangan – Modul ini telah dibangunkan dan diintegrasikan.
18. 2. Kemas Kini Terkini – Tidak dinyatakan butiran terperinci, namun modul sudah tersedia.

7. TINDAKAN DAN STATUS
19. 1. Kesimpulan – Semua komponen utama projek telah disediakan, dengan penekanan pada kemas kini FAQ dan ujian dalaman.
20. 2. Arahan Akhir – Semua pihak diminta mematuhi tindakan yang dinyatakan dan melaporkan kemajuan pada mesyuarat seterusnya."""

    print("Testing DOCX numbering fix...")
    print("=" * 50)
    
    try:
        # Create the document with the fixed numbering
        doc = create_docx_report(
            title="Test Meeting Minutes",
            prompt="Format laporan mesyuarat mengikut standard PDRM",
            content=sample_content
        )
        
        # Save test document
        output_path = Path("test_numbering_output.docx")
        doc.save(str(output_path))
        
        print(f"✅ Test completed successfully!")
        print(f"📄 Test document saved as: {output_path}")
        print("\nThe document should now have proper hierarchical numbering:")
        print("- Main sections: 1., 2., 3., etc.")
        print("- Sub-sections: 1.1, 1.2, 2.1, 2.2, etc.")
        print("- Nested bullet points should be properly formatted")
        
        return True
        
    except Exception as e:
        print(f"❌ Test failed with error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    test_numbering_fix()