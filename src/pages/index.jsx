// src/pages/index.jsx

import { BrowserRouter as Router, Route, Routes, useLocation } from "react-router-dom";

import Layout from "./Layout.jsx";

import Home from "./Home";
import StudentDashboard from "./StudentDashboard";
import Exercise from "./Exercise";
import TeacherDashboard from "./TeacherDashboard";
import CreateExercise from "./CreateExercise";
import CreateCustomExercise from "./CreateCustomExercise";
import CreateLesson from "./CreateLesson";
import StudentLessons from "./StudentLessons";
import Dictionary from "./Dictionary";
import SpecialTraining from "./SpecialTraining";
import StudentOnboarding from "./StudentOnboarding";
import ParentDashboard from "./ParentDashboard";
import FeedbackLog from "./FeedbackLog";
import Certificates from "./Certificates";
import WritingWorkshop from "./WritingWorkshop"; 
import SmartDictation from "./SmartDictation";
import NooraniaLearning from "./NooraniaLearning"; // ✅ إضافة الاستيراد هنا

// ✅ 1. استيراد الصفحات الجديدة
import Blog from "./Blog";
import AboutUs from "./AboutUs";
import ContactUs from "./ContactUs";
import PrivacyPolicy from "./privacy";

const PAGES = {
  Home,
  StudentDashboard,
  Exercise,
  TeacherDashboard,
  CreateExercise,
  CreateCustomExercise,
  CreateLesson,
  StudentLessons,
  Dictionary,
  SpecialTraining,
  StudentOnboarding,
  ParentDashboard,
  FeedbackLog,
  Certificates,
  WritingWorkshop,
  SmartDictation,
  NooraniaLearning, // ✅ إضافتها لقائمة الصفحات
  // ✅ 2. إضافتها لقائمة الصفحات (للتعرف على اسم الصفحة الحالي)
  Blog,
  AboutUs,
  ContactUs,
  PrivacyPolicy,
};

function _getCurrentPage(url) {
  if (url.endsWith("/")) {
    url = url.slice(0, -1);
  }

  let urlLastPart = url.split("/").pop();
  if (urlLastPart.includes("?")) {
    urlLastPart = urlLastPart.split("?")[0];
  }

  const pageName = Object.keys(PAGES).find(
    (page) => page.toLowerCase() === urlLastPart.toLowerCase()
  );

  return pageName || Object.keys(PAGES)[0];
}

// هذا الغلاف يستخدم useLocation داخل الـ Router
function PagesContent() {
  const location = useLocation();
  const currentPage = _getCurrentPage(location.pathname);

  return (
    <Layout currentPageName={currentPage}>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/Home" element={<Home />} />
        <Route path="/StudentDashboard" element={<StudentDashboard />} />
        <Route path="/Exercise" element={<Exercise />} />
        <Route path="/TeacherDashboard" element={<TeacherDashboard />} />
        <Route path="/CreateExercise" element={<CreateExercise />} />
        <Route path="/CreateCustomExercise" element={<CreateCustomExercise />} />
        <Route path="/CreateLesson" element={<CreateLesson />} />
        <Route path="/StudentLessons" element={<StudentLessons />} />
        <Route path="/Dictionary" element={<Dictionary />} />
        <Route path="/SpecialTraining" element={<SpecialTraining />} />
        <Route path="/StudentOnboarding" element={<StudentOnboarding />} />
        <Route path="/ParentDashboard" element={<ParentDashboard />} />
        <Route path="/FeedbackLog" element={<FeedbackLog />} />
        <Route path="/Certificates" element={<Certificates />} />
        <Route path="/WritingWorkshop" element={<WritingWorkshop />} />
        <Route path="/SmartDictation" element={<SmartDictation />} />
        <Route path="/NooraniaLearning" element={<NooraniaLearning />} /> {/* ✅ إضافة الرابط هنا */}
        
        {/* ✅ 3. إضافة المسارات (Routes) الجديدة */}
        <Route path="/Blog" element={<Blog />} />
        <Route path="/AboutUs" element={<AboutUs />} />
        <Route path="/ContactUs" element={<ContactUs />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
      </Routes>
    </Layout>
  );
}

export default function Pages() {
  return (
    <Router>
      <PagesContent />
    </Router>
  );
}
