/**
 * All Indian school boards — National + State/UT boards.
 * Kept in a data file so it can be updated without touching components.
 */

export interface Board {
  id: string
  name: string
  fullName: string
  category: 'national' | 'state'
  state?: string // ISO state abbreviation or full name
}

export const BOARDS: Board[] = [
  // ── National Boards ───────────────────────────────────────────────────
  {
    id: 'cbse',
    name: 'CBSE',
    fullName: 'Central Board of Secondary Education',
    category: 'national',
  },
  {
    id: 'icse',
    name: 'ICSE',
    fullName: 'Indian Certificate of Secondary Education (CISCE)',
    category: 'national',
  },
  {
    id: 'nios',
    name: 'NIOS',
    fullName: 'National Institute of Open Schooling',
    category: 'national',
  },
  {
    id: 'cbse_madrasa',
    name: 'CBSE Madrasa',
    fullName: 'Central Board of Secondary Education (Madrasa)',
    category: 'national',
  },

  // ── State Boards ──────────────────────────────────────────────────────
  {
    id: 'karnataka',
    name: 'Karnataka (KSEEB)',
    fullName: 'Karnataka Secondary Education Examination Board',
    category: 'state',
    state: 'Karnataka',
  },
  {
    id: 'tamilnadu',
    name: 'Tamil Nadu (TNBSE)',
    fullName: 'Tamil Nadu Board of Secondary Education',
    category: 'state',
    state: 'Tamil Nadu',
  },
  {
    id: 'maharashtra',
    name: 'Maharashtra (MSBSHSE)',
    fullName: 'Maharashtra State Board of Secondary and Higher Secondary Education',
    category: 'state',
    state: 'Maharashtra',
  },
  {
    id: 'kerala',
    name: 'Kerala (KBPE)',
    fullName: 'Kerala Board of Public Examinations',
    category: 'state',
    state: 'Kerala',
  },
  {
    id: 'andhra',
    name: 'Andhra Pradesh (BSEAP)',
    fullName: 'Board of Secondary Education, Andhra Pradesh',
    category: 'state',
    state: 'Andhra Pradesh',
  },
  {
    id: 'telangana',
    name: 'Telangana (BSET)',
    fullName: 'Board of Secondary Education Telangana',
    category: 'state',
    state: 'Telangana',
  },
  {
    id: 'uttar_pradesh',
    name: 'Uttar Pradesh (UPMSP)',
    fullName: 'Uttar Pradesh Madhyamik Shiksha Parishad',
    category: 'state',
    state: 'Uttar Pradesh',
  },
  {
    id: 'bihar',
    name: 'Bihar (BSEB)',
    fullName: 'Bihar School Examination Board',
    category: 'state',
    state: 'Bihar',
  },
  {
    id: 'west_bengal',
    name: 'West Bengal (WBBSE)',
    fullName: 'West Bengal Board of Secondary Education',
    category: 'state',
    state: 'West Bengal',
  },
  {
    id: 'gujarat',
    name: 'Gujarat (GSEB)',
    fullName: 'Gujarat Secondary and Higher Secondary Education Board',
    category: 'state',
    state: 'Gujarat',
  },
  {
    id: 'rajasthan',
    name: 'Rajasthan (RBSE)',
    fullName: 'Rajasthan Board of Secondary Education',
    category: 'state',
    state: 'Rajasthan',
  },
  {
    id: 'madhya_pradesh',
    name: 'Madhya Pradesh (MPBSE)',
    fullName: 'Madhya Pradesh Board of Secondary Education',
    category: 'state',
    state: 'Madhya Pradesh',
  },
  {
    id: 'punjab',
    name: 'Punjab (PSEB)',
    fullName: 'Punjab School Education Board',
    category: 'state',
    state: 'Punjab',
  },
  {
    id: 'haryana',
    name: 'Haryana (HBSE)',
    fullName: 'Haryana Board of School Education',
    category: 'state',
    state: 'Haryana',
  },
  {
    id: 'odisha',
    name: 'Odisha (BSE)',
    fullName: 'Board of Secondary Education, Odisha',
    category: 'state',
    state: 'Odisha',
  },
  {
    id: 'assam',
    name: 'Assam (SEBA)',
    fullName: 'Board of Secondary Education, Assam',
    category: 'state',
    state: 'Assam',
  },
  {
    id: 'delhi',
    name: 'Delhi (GNCT)',
    fullName: 'Government of NCT of Delhi (follows CBSE)',
    category: 'state',
    state: 'Delhi',
  },
  {
    id: 'himachal',
    name: 'Himachal Pradesh (HPBOSE)',
    fullName: 'Himachal Pradesh Board of School Education',
    category: 'state',
    state: 'Himachal Pradesh',
  },
  {
    id: 'uttarakhand',
    name: 'Uttarakhand (UBSE)',
    fullName: 'Uttarakhand Board of School Education',
    category: 'state',
    state: 'Uttarakhand',
  },
  {
    id: 'jharkhand',
    name: 'Jharkhand (JAC)',
    fullName: 'Jharkhand Academic Council',
    category: 'state',
    state: 'Jharkhand',
  },
  {
    id: 'chhattisgarh',
    name: 'Chhattisgarh (CGBSE)',
    fullName: 'Chhattisgarh Board of Secondary Education',
    category: 'state',
    state: 'Chhattisgarh',
  },
  {
    id: 'jammu_kashmir',
    name: 'J&K (JKBOSE)',
    fullName: 'Jammu and Kashmir Board of School Education',
    category: 'state',
    state: 'Jammu & Kashmir',
  },
  {
    id: 'goa',
    name: 'Goa (GBSHSE)',
    fullName: 'Goa Board of Secondary and Higher Secondary Education',
    category: 'state',
    state: 'Goa',
  },
  {
    id: 'northeast_tripura',
    name: 'Tripura (TBSE)',
    fullName: 'Tripura Board of Secondary Education',
    category: 'state',
    state: 'Tripura',
  },
  {
    id: 'meghalaya',
    name: 'Meghalaya (MBOSE)',
    fullName: 'Meghalaya Board of School Education',
    category: 'state',
    state: 'Meghalaya',
  },
  {
    id: 'manipur',
    name: 'Manipur (BSEM)',
    fullName: 'Board of Secondary Education Manipur',
    category: 'state',
    state: 'Manipur',
  },
  {
    id: 'nagaland',
    name: 'Nagaland (NBSE)',
    fullName: 'Nagaland Board of School Education',
    category: 'state',
    state: 'Nagaland',
  },
  {
    id: 'mizoram',
    name: 'Mizoram (MBSE)',
    fullName: 'Mizoram Board of School Education',
    category: 'state',
    state: 'Mizoram',
  },
  {
    id: 'arunachal',
    name: 'Arunachal Pradesh (DBSE)',
    fullName: 'Directorate of Education, Arunachal Pradesh',
    category: 'state',
    state: 'Arunachal Pradesh',
  },
  {
    id: 'sikkim',
    name: 'Sikkim (SCERT)',
    fullName: 'State Council of Educational Research and Training, Sikkim',
    category: 'state',
    state: 'Sikkim',
  },
  {
    id: 'puducherry',
    name: 'Puducherry (BSEPU)',
    fullName: 'Board of School Education, Puducherry',
    category: 'state',
    state: 'Puducherry',
  },
  {
    id: 'chandigarh',
    name: 'Chandigarh (follows CBSE)',
    fullName: 'UT Chandigarh (follows CBSE syllabus)',
    category: 'state',
    state: 'Chandigarh',
  },
  {
    id: 'dadra',
    name: 'Dadra & Nagar Haveli',
    fullName: 'Dadra and Nagar Haveli and Daman and Diu (follows CBSE)',
    category: 'state',
    state: 'Dadra & Nagar Haveli',
  },
  {
    id: 'andaman',
    name: 'Andaman & Nicobar',
    fullName: 'Andaman and Nicobar Islands (follows CBSE)',
    category: 'state',
    state: 'Andaman & Nicobar',
  },
  {
    id: 'lakshadweep',
    name: 'Lakshadweep',
    fullName: 'Lakshadweep (follows CBSE)',
    category: 'state',
    state: 'Lakshadweep',
  },
  {
    id: 'ladakh',
    name: 'Ladakh (follows CBSE)',
    fullName: 'UT Ladakh (follows CBSE syllabus)',
    category: 'state',
    state: 'Ladakh',
  },
]
