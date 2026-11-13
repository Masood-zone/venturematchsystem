import { z } from "zod";

// USTED Kumasi campus programmes, verified on 2026-11-08.
// Sources: 2026/2027 admissions brochures, Kumasi sections only (before Asante Mampong).
// https://usted.edu.gh/wp-content/uploads/2026/05/USTED_Undergraduate_Programmes_2026-2027.pdf
// https://usted.edu.gh/wp-content/uploads/2026/05/USTED_Postgraduate_Programmes_2026-2027_Aacademic_Year.pdf
// Programme names are listed once across full-time, weekend and sandwich sessions.
export const programmes = [
  // Undergraduate: Faculty of Technical Education.
  "B.Sc. Construction Technology and Management with Education",
  "B.Sc. Wood Technology with Education",
  "B.Sc. Welding and Fabrication Engineering Technology with Education",
  "B.Sc. Plumbing and Gas Technology",
  "B.Ed. Applied Technology (Building Construction and Wood)",
  "B.Ed. Design and Communication Technology",
  "2-year Diploma in Construction Technology",
  "2-year Diploma in Architecture and Digital Construction",
  "2-year Diploma in Wood Technology",
  "2-year Diploma in Welding and Fabrication Technology",

  // Undergraduate: Faculty of Engineering and Technology.
  "B.Sc. Mechanical Engineering Technology Education",
  "B.Sc. Mechanical Engineering Technology",
  "B.Sc. Automotive Engineering Technology Education",
  "B.Sc. Electrical and Electronics Engineering with Education",
  "B.Sc. Electrical and Electronics Engineering",
  "B.Sc. Civil Engineering",
  "B.Sc. Biomedical Equipment Engineering",
  "B.Sc. Renewable Energy Engineering with Education",
  "B.Ed. Applied Technology (Electrical and Electronics)",
  "B.Ed. Applied Technology (Automotive and Mechanical)",
  "B.Ed. STEM (Engineering with Biomedical Science)",
  "B.Ed. STEM (Engineering with Manufacturing)",
  "B.Ed. STEM (Engineering with Robotics)",
  "2-year Diploma in Automotive Technology",
  "2-year Diploma in Mechanical Technology",

  // Undergraduate: Faculty of Vocational Education.
  "B.Sc. Fashion Design and Textiles Education",
  "B.Sc. Catering and Hospitality Education",
  "B.Ed. Art and Design Technology",
  "B.Ed. Home Economics (Clothing and Textiles)",
  "B.Ed. Home Economics (Food and Nutrition)",
  "2-year Diploma in Fashion Design and Textiles",
  "2-year Diploma in Catering and Hospitality",

  // Undergraduate: Faculty of Applied Sciences and Mathematics Education.
  "B.Sc. Information Technology",
  "B.Sc. Cyber Security and Digital Forensics",
  "B.Sc. Statistical Computing",
  "B.Sc. Mathematics",
  "B.Ed. Computing with Artificial Intelligence (AI)",
  "B.Ed. Computing with Internet of Things (IOT)",
  "B.Ed. Information Technology",
  "B.Ed. Mathematics",
  "2-year Diploma in Cyber Security and Digital Forensics",
  "2-year Diploma in Information Technology",

  // Undergraduate: Faculty of Education and Communication Sciences.
  "B.Ed. English",
  "B.Ed. French",
  "B.Ed. Arabic",
  "B.Ed. Social Studies",
  "B.Ed. Geography",
  "B.Ed. Ghanaian Language (Asante Twi)",
  "B.Ed. Early Grade",
  "B.Ed. Upper Primary",
  "B.Ed. Physical Education and Health",

  // Undergraduate: Faculty of Business Education.
  "B.Sc. Accounting",
  "B.Sc. Procurement and Supply Chain Management",
  "B.Sc. Banking and Finance",
  "B.Sc. Business Information Systems",
  "B.Sc. Marketing",
  "B.Sc. Economics with Social Studies",
  "B.B.A. Management",
  "B.Ed. Business Studies (Accounting)",
  "B.Ed. Business Studies (Management)",
  "B.Ed. Economics",
  "B.Sc. Economics",

  // Undergraduate: Institutes.
  "B.Sc. Entrepreneurship Education",
  "B.Sc. Marketing and Entrepreneurship",
  "Diploma in Education, Competency-Based Training (CBT)",

  // Postgraduate: Faculty of Education and Communication Sciences.
  "PhD Educational Leadership",
  "M.Phil. English",
  "M.Phil. Educational Leadership (Curriculum Development option)",
  "M.Phil. Educational Leadership (Instructional Design and Technology option)",
  "M.Phil. Educational Leadership (Organisational Behaviour and Management Education option)",
  "M.Phil. in Teaching and Learning",
  "Postgraduate Diploma in Education (PGDE)",
  "M.A. Educational Leadership (Curriculum option)",
  "M.A. Educational Leadership (Educational Technology option)",
  "M.A. Educational Leadership (Organisational Behaviour and Management in Education option)",
  "Postgraduate Diploma in Teaching and Learning in Higher Education",
  "Postgraduate Diploma in Professional Educational Leadership (PGDEL)",
  "National Professional Education Leadership Qualifications (NPELQF)",

  // Postgraduate: Faculty of Technical Education (as grouped in the brochure).
  "PhD Wood Science and Technology",
  "PhD Construction Technology",
  "PhD Construction Management",
  "M.Phil. Wood Science and Technology",
  "M.Phil. Construction Technology",
  "M.Phil. Construction Management",
  "M.Phil. Electrical Power Systems Engineering",
  "M.Phil. Mechanical Engineering Technology",
  "M.Phil. Automotive Engineering Technology",
  "M.Tech. Wood Science and Technology",
  "M.Tech. Construction Technology",
  "M.Tech. Construction Management",
  "M.Tech. Electrical and Electronics Engineering",
  "M.Tech. Mechanical Engineering Technology",
  "M.Tech. Automotive Engineering Technology",

  // Postgraduate: Faculty of Vocational Education.
  "M.Phil. Fashion Design and Textiles",
  "M.Phil. Catering and Hospitality",
  "M.Tech. Catering and Hospitality",
  "M.Tech. Fashion Design and Textiles",

  // Postgraduate: Faculty of Applied Sciences and Mathematics Education.
  "PhD Mathematics Education",
  "M.Phil. Mathematics Education",
  "M.Phil. Information Technology",
  "M.Phil. Information Studies",
  "M.Sc. Information Technology Education",
  "M.Ed. Mathematics Education",

  // Postgraduate: Faculty of Business Education.
  "M.Phil. Business Management",
  "M.Phil. Accounting",
  "MBA Accounting",
  "MBA Finance",
  "MBA Human Resource Management and Organisational Behaviour",
  "MBA Marketing",
];

export const programmeSchema = z.string().refine(
  (value) => programmes.includes(value),
  "Choose a Kumasi campus programme.",
);
