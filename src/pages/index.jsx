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

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Home: Home,
    
    StudentDashboard: StudentDashboard,
    
    Exercise: Exercise,
    
    TeacherDashboard: TeacherDashboard,
    
    CreateExercise: CreateExercise,
    
    CreateCustomExercise: CreateCustomExercise,
    
    CreateLesson: CreateLesson,
    
    StudentLessons: StudentLessons,
    
    Dictionary: Dictionary,
    
    SpecialTraining: SpecialTraining,
    
    StudentOnboarding: StudentOnboarding,
    
    ParentDashboard: ParentDashboard,
    
    FeedbackLog: FeedbackLog,
    
    Certificates: Certificates,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
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