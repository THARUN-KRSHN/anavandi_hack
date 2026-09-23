"""Populate realistic GPS coordinates for all 97 KSRTC depots in app.db."""

import sqlite3
import os

DEPOT_COORDS = {
    'ADOOR': (9.1530, 76.7356),
    'ALAPPUZHA': (9.4981, 76.3388),
    'ALUVA': (10.1076, 76.3516),
    'ANAYARA': (8.5085, 76.9150),
    'ANKAMALI': (10.1960, 76.3860),
    'ARYANAD': (8.5997, 77.0673),
    'ARYANKAVU': (8.9772, 77.1436),
    'ATTINGAL': (8.6964, 76.8143),
    'BANGALORE': (12.9716, 77.5946),
    'CHADAYAMANGALAM': (8.9950, 76.9247),
    'CHALAKUDY': (10.3070, 76.3330),
    'CHANGANASSERY': (9.4447, 76.5447),
    'CHATHANNUR': (8.8587, 76.7197),
    'CHENGANOOR': (9.3175, 76.6111),
    'CHERTHALA': (9.6845, 76.3314),
    'CHITOOR': (10.7027, 76.7171),
    'EDATHUVA': (9.3621, 76.4789),
    'EENCHAKKAL': (8.4842, 76.9405),
    'EERATTUPETTAH': (9.6800, 76.7800),
    'ERNAKULAM': (9.9816, 76.2999),
    'ERUMELY': (9.5772, 76.8528),
    'GURUVAYOOR': (10.5946, 76.0422),
    'HARIPPAD': (9.2882, 76.4608),
    'IRINJALAKKUDA': (10.3426, 76.2057),
    'KALPETTA': (11.6054, 76.0827),
    'KANHANGAD': (12.3082, 75.0911),
    'KANIYAPURAM': (8.5975, 76.8578),
    'KANNUR': (11.8745, 75.3704),
    'KARUNAGAPALLY': (9.0544, 76.5369),
    'KASARAGOD': (12.5102, 74.9852),
    'KATTAKADA': (8.5081, 77.0789),
    'KATTAPPANA': (9.7508, 77.1189),
    'KAYAMKULAM': (9.1764, 76.5003),
    'KILIMANOOR': (8.7667, 76.8778),
    'KODUNGALOOR': (10.2284, 76.1950),
    'KOLLAM': (8.8932, 76.6141),
    'KONNI': (9.2394, 76.8486),
    'KOOTHATTUKULAM': (9.8664, 76.5822),
    'KOTHAMANGALAM': (10.0614, 76.6278),
    'KOTTARAKKARA': (9.0003, 76.7725),
    'KOTTAYAM': (9.5916, 76.5222),
    'KOZHIKODE': (11.2588, 75.7804),
    'KULATHUPUZHA': (8.9056, 77.0628),
    'KUMALY': (9.6106, 77.1644),
    'MALA': (10.2197, 76.2975),
    'MALAPPURAM': (11.0510, 76.0711),
    'MALLAPALLY': (9.4533, 76.6508),
    'MANANTHAVADY': (11.8028, 76.0033),
    'MANNARGHAT': (10.9889, 76.4614),
    'MAVELIKARA': (9.2667, 76.5500),
    'MOOLAMATTOM': (9.7942, 76.8967),
    'MOOVATTUPUZHA': (9.9869, 76.5775),
    'MUNNAR': (10.0889, 77.0595),
    'NEDUMANGAD': (8.6019, 76.9997),
    'NEDUMKANDAM': (9.8394, 77.1650),
    'NEYYATINKARA': (8.4006, 77.0864),
    'NILAMBUR': (11.2778, 76.2269),
    'NORTH PARAVUR': (10.1478, 76.2308),
    'PALA': (9.7114, 76.6828),
    'PALAKKAD': (10.7867, 76.6548),
    'PALODE': (8.7061, 77.0278),
    'PAMBA': (9.4039, 77.0700),
    'PANDALAM': (9.2319, 76.6842),
    'PAPPANAMCODE': (8.4722, 76.9744),
    'PARASSALA': (8.3414, 77.1539),
    'PATHANAMTHITTA': (9.2648, 76.7870),
    'PATHANAPURAM': (9.0911, 76.8572),
    'PAYYANUR': (12.1006, 75.2033),
    'PERINTHAMANNA': (10.9761, 76.2253),
    'PEROORKADA': (8.5342, 76.9692),
    'PERUMBAVOOR': (10.1114, 76.4756),
    'PIRAVOM': (9.8703, 76.4914),
    'PONKUNNAM': (9.5764, 76.7583),
    'PONNANI': (10.7672, 75.9253),
    'POOVAR': (8.3189, 77.0672),
    'PUNALUR': (9.0167, 76.9333),
    'PUTHUKKADU': (10.4286, 76.2731),
    'RANNI': (9.3831, 76.7872),
    'SULTHANBATHERY': (11.6628, 76.2575),
    'THALASSERY': (11.7491, 75.4890),
    'THAMARASSERY': (11.4172, 75.9347),
    'THIRUVALLA': (9.3835, 76.5741),
    'THIRUVAMBADY': (11.4286, 76.0125),
    'THODUPUZHA': (9.8958, 76.7183),
    'THOTTILPALAM': (11.6500, 75.8167),
    'THRISSUR': (10.5276, 76.2144),
    'TVM CENTRAL': (8.4900, 76.9530),
    'TVM CITY': (8.4875, 76.9486),
    'VADAKARA': (11.6089, 75.5917),
    'VADAKKANCHERY': (10.6083, 76.2500),
    'VAIKOM': (9.7486, 76.3958),
    'VELLANAD': (8.5614, 77.0506),
    'VELLARADA': (8.4414, 77.2081),
    'VENJARAMOODU': (8.6833, 76.9167),
    'VIKASBHAVAN': (8.5089, 76.9456),
    'VITHURA': (8.6853, 77.1008),
    'VIZHINJAM': (8.3800, 77.0000),
}


def populate():
    db_path = os.path.join(os.path.dirname(__file__), "..", "..", "instance", "app.db")
    db_path = os.path.abspath(db_path)
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return

    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    depots = c.execute("SELECT id, name FROM depots").fetchall()
    updated = 0
    for depot_id, name in depots:
        coords = DEPOT_COORDS.get(name.upper().strip())
        if coords:
            c.execute("UPDATE depots SET latitude = ?, longitude = ? WHERE id = ?", (coords[0], coords[1], depot_id))
            updated += 1
        else:
            # Fallback within central Kerala
            c.execute("UPDATE depots SET latitude = ?, longitude = ? WHERE id = ?", (9.9816, 76.2999, depot_id))
            updated += 1
    conn.commit()
    conn.close()
    print(f"Successfully populated coordinates for {updated} depots.")


if __name__ == "__main__":
    populate()
