/**
 * Comprehensive Vastu PDF Report Generator
 * Professional detailed report with complete Vastu analysis
 */

import { jsPDF } from 'jspdf';

// Complete Vastu data with all 16 directions for each room
const VASTU_DATA = {
    'Bedroom': {
        'N': { zone: 'Best', effects: ['Bedroom in North zone promotes prosperity and wealth', 'Ensures good health and vitality for occupants', 'Promotes peaceful and restful sleep', 'Enhances mental clarity and decision making'], element: 'Water', planet: 'Mercury', colors: ['Blue', 'Light Green', 'White'], avoid: ['Red', 'Yellow'], remedies: ['Use Zinc helix for balancing energy', 'Place water element paintings on North wall', 'Use blue or green bedsheets'] },
        'NNE': { zone: 'Bad', effects: ['Causes health issues and illness', 'Weakens immunity system significantly', 'Creates mental confusion and stress', 'May lead to respiratory problems'], element: 'Water', planet: 'Mercury', colors: ['Blue', 'White'], avoid: ['Red', 'Orange'], remedies: ['Use Zinc and Redsandalwood aroma essential oil', 'Place copper pyramid in NE corner', 'Use salt water bowls to absorb negativity'] },
        'NE': { zone: 'Good', effects: ['Brings peace, prosperity and spiritual growth', 'Good for children and elderly people', 'Promotes clarity of thought', 'Not ideal for married couples - reduces intimacy'], element: 'Water', planet: 'Jupiter', colors: ['Yellow', 'White', 'Light Blue'], avoid: ['Red', 'Black'], remedies: ['Keep this zone clean and clutter-free', 'Place meditation area here'] },
        'ENE': { zone: 'Good', effects: ['Gives joy, happiness and good news', 'Ideal zone for pregnant ladies', 'Promotes creativity and new beginnings', 'Enhances fertility'], element: 'Air', planet: 'Venus', colors: ['Blue', 'Light Green', 'White'], avoid: ['Red', 'Black'], remedies: ['Use Saffron and Camphor aroma', 'Place photos of nature or green plants'] },
        'E': { zone: 'Good', effects: ['Brings vitality, energy and freshness', 'Excellent for social connectivity', 'Promotes career growth and recognition', 'Morning sun brings positive energy'], element: 'Air', planet: 'Sun', colors: ['Blue', 'Light Green', 'White'], avoid: ['Red', 'Yellow'], remedies: ['Allow morning sunlight to enter', 'Use light colored curtains'] },
        'ESE': { zone: 'Bad', effects: ['Creates anxiety and mental stress', 'Causes disputes between couples', 'Leads to aggressive behavior', 'May cause skin problems'], element: 'Air', planet: 'Venus', colors: ['Blue', 'Green'], avoid: ['Red', 'Orange'], remedies: ['Use Saffron, Red Rose aroma essential oil', 'Place green plants in this zone', 'Avoid keeping bedroom here if possible'] },
        'SE': { zone: 'Bad', effects: ['Causes selfish and aggressive nature', 'Creates unrest among family members', 'Leads to career instability', 'Fire element conflicts with rest'], element: 'Fire', planet: 'Venus', colors: ['Yellow', 'Green'], avoid: ['Blue', 'Black'], remedies: ['Use Jasmine and Sandalwood aroma', 'Never use mirrors in this zone bedroom', 'Use copper triangular helix for remedy'] },
        'SSE': { zone: 'Good', effects: ['Helps gain confidence and courage', 'Promotes mental and physical strength', 'Good for decision making', 'Enhances leadership qualities'], element: 'Fire', planet: 'Mars', colors: ['Yellow', 'Green', 'Orange'], avoid: ['Blue', 'Black'], remedies: ['Use warm but not aggressive colors', 'Place motivational images'] },
        'S': { zone: 'Best', effects: ['Gives deep calmness and peace', 'Ensures peaceful and healthy sleep', 'Promotes fame and recognition', 'Ideal for master bedroom'], element: 'Fire', planet: 'Mars', colors: ['Yellow', 'Green', 'Red'], avoid: ['Blue', 'Black'], remedies: ['Use heavy furniture in this zone', 'Keep head towards South while sleeping'] },
        'SSW': { zone: 'Bad', effects: ['Causes high expenditure and financial drain', 'Leads to body aches and arthritis', 'Creates lethargy and laziness', 'May cause chronic health issues'], element: 'Earth', planet: 'Rahu', colors: ['Yellow', 'White'], avoid: ['Blue', 'Red', 'Green'], remedies: ['Use Lead Helix remedy', 'Use Orange blossom with Tuberose aroma', 'Place heavy objects to ground energy'] },
        'SW': { zone: 'Good', effects: ['Ideal zone for head of the family', 'Perfect for married couples', 'Promotes stability and grounding', 'Not ideal for young children'], element: 'Earth', planet: 'Rahu', colors: ['Yellow', 'White', 'Brown'], avoid: ['Blue', 'Green'], remedies: ['Master bedroom ideally here', 'Use earthen colors', 'Place couples photos'] },
        'WSW': { zone: 'Best', effects: ['Ideal for peace and stability in family', 'Brings financial gains and savings', 'Best zone for students studying', 'Promotes learning and knowledge'], element: 'Space', planet: 'Ketu', colors: ['Yellow', 'White'], avoid: ['Red', 'Green'], remedies: ['Use Circle Brass Helix', 'Use Lavender and Sandalwood aroma', 'Place study table here for students'] },
        'W': { zone: 'Good', effects: ['Good for peace and harmony', 'Promotes restful evening relaxation', 'Encourages savings and financial stability', 'Good for meditation'], element: 'Space', planet: 'Saturn', colors: ['Yellow', 'White', 'Blue'], avoid: ['Red', 'Green'], remedies: ['Use calming colors', 'Place metal objects'] },
        'WNW': { zone: 'Very Bad', effects: ['Causes severe anxiety and depression', 'May bring suicidal thoughts', 'Creates unknown fears and phobias', 'Highly negative for mental health'], element: 'Space', planet: 'Moon', colors: ['Yellow', 'White', 'Blue'], avoid: ['Red', 'Green'], remedies: ['URGENT: Apply strong remedies immediately', 'Use Brass Circle Helix', 'Use Lavender, Sandalwood and Citrus aroma', 'Consider relocating bedroom'] },
        'NW': { zone: 'Not Ideal', effects: ['Leads to emotional conflicts', 'Creates unstable relationships', 'Causes frequent cough and cold', 'Increases restlessness'], element: 'Space', planet: 'Moon', colors: ['Yellow', 'White', 'Blue'], avoid: ['Red', 'Green'], remedies: ['Use Circle Brass Helix', 'Use lavender, pine and lemon aroma', 'Add grounding elements'] },
        'NNW': { zone: 'Good', effects: ['Excellent for newly married couples', 'Increases attraction between partners', 'Promotes romantic relationships', 'Good for intimacy'], element: 'Water', planet: 'Moon', colors: ['Blue', 'Light Green', 'White'], avoid: ['Red', 'Yellow'], remedies: ['Use romantic colors', 'Place couples artwork'] }
    },
    'Kitchen': {
        'N': { zone: 'Bad', effects: ['Causes financial losses', 'Health issues for family', 'Water-fire conflict creates imbalance'], element: 'Water', planet: 'Mercury', colors: ['Orange', 'Red accents'], avoid: ['Blue', 'Black'], remedies: ['Use red/orange accents to balance', 'Place copper utensils', 'Use fire element paintings'] },
        'NE': { zone: 'Very Bad', effects: ['NEVER place kitchen in NE', 'Causes severe health problems', 'Major financial losses', 'Destroys positive energy of sacred corner'], element: 'Water', planet: 'Jupiter', colors: [], avoid: ['All colors bad here'], remedies: ['CRITICAL: Relocate kitchen if possible', 'Use copper pyramid remedy', 'Place heavy brass items'] },
        'E': { zone: 'Good', effects: ['Good for health and prosperity', 'Morning sun energizes food', 'Promotes healthy cooking habits', 'Family health improves'], element: 'Air', planet: 'Sun', colors: ['Yellow', 'Orange', 'Green'], avoid: ['Blue'], remedies: ['Allow morning light', 'Face East while cooking'] },
        'SE': { zone: 'Best', effects: ['IDEAL location - Fire corner (Agni)', 'Perfect alignment with fire element', 'Promotes health and prosperity', 'Food cooked here is most nourishing', 'Enhances digestive health of family'], element: 'Fire', planet: 'Venus', colors: ['Red', 'Orange', 'Yellow', 'Green'], avoid: ['Blue', 'Black'], remedies: ['Stove should be in SE corner facing East', 'Use fire element colors'] },
        'S': { zone: 'Good', effects: ['Good secondary placement', 'Supports digestive health', 'Fire element present'], element: 'Fire', planet: 'Mars', colors: ['Red', 'Orange', 'Yellow'], avoid: ['Blue', 'Black'], remedies: ['Face East while cooking'] },
        'SW': { zone: 'Bad', effects: ['Causes temper issues in family', 'Financial instability', 'Conflicts between family members'], element: 'Earth', planet: 'Rahu', colors: ['Green', 'Yellow'], avoid: ['Red', 'Blue'], remedies: ['Use green plants as remedy', 'Add earthen pots'] },
        'W': { zone: 'Neutral', effects: ['Acceptable but not ideal', 'May cause some digestive issues', 'Evening cooking less energetic'], element: 'Space', planet: 'Saturn', colors: ['Yellow', 'Orange'], avoid: ['Blue'], remedies: ['Use red/orange accents', 'Face East while cooking'] },
        'NW': { zone: 'Good', effects: ['Second best option after SE', 'Good for health', 'Wind element helps ventilation', 'Removes cooking odors effectively'], element: 'Air', planet: 'Moon', colors: ['Yellow', 'Orange', 'White'], avoid: ['Blue', 'Black'], remedies: ['Ensure good ventilation', 'Use exhaust in NW'] }
    },
    'Dining': {
        'N': { zone: 'Not Ideal', effects: ['Causes money problems', 'Creates conflict during meals', 'Family disputes over food'], element: 'Water', planet: 'Mercury', colors: ['Yellow', 'Orange'], avoid: ['Blue'], remedies: ['Use warm colors in dining', 'Add red/orange table mats'] },
        'NE': { zone: 'Good', effects: ['Makes family spiritual and pious', 'Brings productive conversations', 'Meals become sacred family time'], element: 'Water', planet: 'Jupiter', colors: ['Yellow', 'White', 'Light colors'], avoid: ['Dark colors'], remedies: ['Keep dining simple and clean', 'Add spiritual elements'] },
        'E': { zone: 'Best', effects: ['IDEAL in all aspects', 'Strong social connections formed', 'Guests feel welcomed', 'Digestive health improves', 'Morning meals most auspicious'], element: 'Air', planet: 'Sun', colors: ['Green', 'Yellow', 'Light colors'], avoid: ['Black', 'Dark blue'], remedies: ['Allow morning light during meals', 'Face East while eating'] },
        'SE': { zone: 'Good', effects: ['Positive and healthy dining', 'Peaceful meal atmosphere', 'Good digestion'], element: 'Fire', planet: 'Venus', colors: ['Yellow', 'Orange', 'Green'], avoid: ['Blue'], remedies: ['Use bright lighting'] },
        'S': { zone: 'Neutral', effects: ['Good routine meals', 'Relaxing dining experience', 'Fame through hospitality'], element: 'Fire', planet: 'Mars', colors: ['Yellow', 'Red', 'Orange'], avoid: ['Black', 'Blue'], remedies: ['Use warm lighting'] },
        'SW': { zone: 'Good', effects: ['Stability and growth in family', 'Gains from ancestral properties', 'Grounded family discussions'], element: 'Earth', planet: 'Rahu', colors: ['Yellow', 'Brown', 'Earthy'], avoid: ['Blue', 'Green'], remedies: ['Use heavy dining table', 'Wooden furniture best'] },
        'W': { zone: 'Good', effects: ['Increases productivity', 'Positive results from family meetings', 'Evening meals satisfying'], element: 'Space', planet: 'Saturn', colors: ['Yellow', 'White'], avoid: ['Red'], remedies: ['Use metal dining accessories'] },
        'NW': { zone: 'Good', effects: ['Favorable for business meetings', 'Good for negotiations over meals', 'Guests feel comfortable'], element: 'Air', planet: 'Moon', colors: ['White', 'Light Blue'], avoid: ['Red', 'Black'], remedies: ['Good for hosting guests'] }
    },
    'Toilet': {
        'N': { zone: 'Bad', effects: ['Causes career problems', 'Financial losses', 'Blocks prosperity', 'Health issues for male members'], element: 'Water', planet: 'Mercury', colors: ['Light colors'], avoid: [], remedies: ['Keep toilet door always closed', 'Use exhaust fan', 'Place salt bowls'] },
        'NE': { zone: 'Very Bad', effects: ['NEVER place toilet in NE', 'Destroys Ishan (God) corner', 'Severe health issues', 'Major wealth destruction', 'Spiritual growth blocked', 'Children education suffers'], element: 'Water', planet: 'Jupiter', colors: [], avoid: ['All bad'], remedies: ['CRITICAL: Relocate if possible', 'Use heavy copper helix remedy', 'Place 7 salt bowls', 'Burn camphor daily', 'Keep door closed with no gaps'] },
        'NW': { zone: 'Best', effects: ['IDEAL placement for toilet', 'Negative energy exits with wind', 'No major issues', 'Self-cleaning energy flow'], element: 'Air', planet: 'Moon', colors: ['White', 'Light colors'], avoid: ['Dark'], remedies: ['Ensure good ventilation', 'Keep clean and dry'] },
        'W': { zone: 'Good', effects: ['Good placement', 'No major issues', 'Stable energy'], element: 'Space', planet: 'Saturn', colors: ['White', 'Light Blue'], avoid: ['Dark'], remedies: ['Keep well-ventilated'] },
        'SE': { zone: 'Bad', effects: ['Fire and water element conflict', 'Causes health issues', 'Skin problems possible', 'Digestive issues'], element: 'Fire', planet: 'Venus', colors: ['Green', 'Light colors'], avoid: ['Red', 'Orange'], remedies: ['Use green plants outside toilet', 'Copper items inside'] },
        'SW': { zone: 'Very Bad', effects: ['Causes major health problems', 'Financial drainage - money flows out', 'Family head faces issues', 'Chronic diseases possible'], element: 'Earth', planet: 'Rahu', colors: ['Yellow', 'Light'], avoid: ['Blue'], remedies: ['Heavy remedy needed', 'Use copper helix', 'Place lead strip under floor', 'Regular salt water mopping'] }
    },
    'Living Room': {
        'N': { zone: 'Best', effects: ['Invites prosperity and wealth', 'Best for family gatherings', 'Career growth for family', 'Positive guest interactions', 'Business discussions successful'], element: 'Water', planet: 'Mercury', colors: ['Blue', 'Green', 'White'], avoid: ['Red', 'Orange'], remedies: ['Place water fountain in North', 'Use blue/green decorations'] },
        'NE': { zone: 'Best', effects: ['Maximum positive energy flow', 'Spiritual growth for family', 'Clarity in decisions', 'Health and wealth combined', 'Most auspicious placement'], element: 'Water', planet: 'Jupiter', colors: ['Yellow', 'White', 'Light Blue'], avoid: ['Dark colors'], remedies: ['Keep temple or prayer area nearby', 'Keep this zone most clean'] },
        'E': { zone: 'Best', effects: ['Social success guaranteed', 'Career growth for all family', 'Morning energy fills the room', 'Fame and recognition', 'Government favors'], element: 'Air', planet: 'Sun', colors: ['Green', 'White', 'Light Yellow'], avoid: ['Black', 'Dark Blue'], remedies: ['Large windows facing East', 'Allow morning sunlight'] },
        'SE': { zone: 'Neutral', effects: ['Acceptable placement', 'May increase activity levels', 'Can make room feel warm'], element: 'Fire', planet: 'Venus', colors: ['Yellow', 'Green'], avoid: ['Blue', 'Black'], remedies: ['Balance with cooling colors'] },
        'S': { zone: 'Bad', effects: ['Causes family conflicts', 'Reduces peace in home', 'Arguments during gatherings', 'Fire element too strong'], element: 'Fire', planet: 'Mars', colors: ['Blue', 'Green', 'White'], avoid: ['Red', 'Orange'], remedies: ['Use cooling colors', 'Add water element', 'Place green plants'] },
        'SW': { zone: 'Bad', effects: ['Not recommended at all', 'Causes lethargy in family', 'Heavy energy blocks activity', 'Guests feel unwelcome'], element: 'Earth', planet: 'Rahu', colors: ['White', 'Light colors'], avoid: ['Dark heavy colors'], remedies: ['Use lighter furniture', 'Add bright lighting'] },
        'W': { zone: 'Good', effects: ['Good for relaxation', 'Evening entertainment ideal', 'Savings energy present', 'Peaceful atmosphere'], element: 'Space', planet: 'Saturn', colors: ['White', 'Blue', 'Grey'], avoid: ['Red'], remedies: ['Metal decorations help'] },
        'NW': { zone: 'Good', effects: ['Good for hosting guests', 'Social connections strengthen', 'Business networking', 'Short-term guests comfortable'], element: 'Air', planet: 'Moon', colors: ['White', 'Silver', 'Light Blue'], avoid: ['Red', 'Black'], remedies: ['Wind chimes in NW', 'Good lighting'] }
    }
};

// Get Vastu details
function getVastuDetails(roomType, direction) {
    const normalizedType = roomType.includes('Bedroom') || roomType.includes('Master') ? 'Bedroom' :
        roomType.includes('Kitchen') ? 'Kitchen' :
            roomType.includes('Dining') ? 'Dining' :
                roomType.includes('Toilet') || roomType.includes('Bathroom') ? 'Toilet' :
                    'Living Room';

    const roomData = VASTU_DATA[normalizedType];
    return roomData?.[direction] || roomData?.['N'] || null;
}

// Analyze room placement
function analyzeRoomPlacement(roomType, direction) {
    const details = getVastuDetails(roomType, direction);

    if (details) {
        const zone = details.zone?.toLowerCase();
        let status, score, color;

        if (zone === 'best' || zone === 'ideal') { status = 'Excellent'; score = 100; color = '#22c55e'; }
        else if (zone === 'good') { status = 'Good'; score = 80; color = '#84cc16'; }
        else if (zone === 'neutral') { status = 'Neutral'; score = 50; color = '#eab308'; }
        else if (zone === 'not ideal') { status = 'Not Ideal'; score = 35; color = '#f97316'; }
        else if (zone === 'bad') { status = 'Poor'; score = 25; color = '#ef4444'; }
        else if (zone === 'very bad') { status = 'Critical'; score = 10; color = '#dc2626'; }
        else { status = 'Unknown'; score = 50; color = '#6b7280'; }

        return { status, score, color, ...details };
    }

    return { status: 'Not Analyzed', score: 50, color: '#6b7280', zone: 'Unknown', effects: [], element: 'Unknown', remedies: [], colors: [], avoid: [] };
}

// Generate comprehensive PDF
export async function generateVastuReport(analysisResult, floorPlanImage, northPos) {
    try {
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = 210;
        const margin = 12;
        const contentWidth = pageWidth - 2 * margin;
        let yPos = margin;

        const primaryGreen = [34, 197, 94];
        const darkText = [17, 24, 39];
        const grayText = [107, 114, 128];
        const lightBg = [249, 250, 251];

        // Calculate analysis data
        let totalScore = 0;
        let roomAnalyses = [];

        if (analysisResult?.rooms) {
            analysisResult.rooms.forEach(room => {
                const direction = room.vastuDirection || 'N';
                const analysis = analyzeRoomPlacement(room.type, direction);
                roomAnalyses.push({ ...room, direction, analysis });
                totalScore += analysis.score;
            });
            totalScore = roomAnalyses.length > 0 ? Math.round(totalScore / roomAnalyses.length) : 0;
        }

        const excellentRooms = roomAnalyses.filter(r => r.analysis.score >= 80).length;
        const poorRooms = roomAnalyses.filter(r => r.analysis.score <= 25).length;

        // ==================== PAGE 1: COVER ====================
        pdf.setFillColor(17, 24, 39);
        pdf.rect(0, 0, pageWidth, 60, 'F');
        pdf.setFillColor(...primaryGreen);
        pdf.rect(0, 58, pageWidth, 4, 'F');

        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(32);
        pdf.setFont('helvetica', 'bold');
        pdf.text('VASTU SHASTRA', pageWidth / 2, 25, { align: 'center' });
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'normal');
        pdf.text('Complete Floor Plan Analysis Report', pageWidth / 2, 38, { align: 'center' });
        pdf.setFontSize(10);
        pdf.setTextColor(156, 163, 175);
        pdf.text(`Generated: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`, pageWidth / 2, 50, { align: 'center' });

        yPos = 75;

        // Score section
        pdf.setFillColor(...lightBg);
        pdf.roundedRect(margin, yPos, contentWidth, 50, 3, 3, 'F');

        const scoreColor = totalScore >= 70 ? primaryGreen : totalScore >= 50 ? [234, 179, 8] : [239, 68, 68];
        pdf.setFillColor(...scoreColor);
        pdf.circle(margin + 30, yPos + 25, 20, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(24);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${totalScore}`, margin + 30, yPos + 29, { align: 'center' });
        pdf.setFontSize(8);
        pdf.text('SCORE', margin + 30, yPos + 38, { align: 'center' });

        pdf.setTextColor(...darkText);
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Overall Vastu Compliance', margin + 60, yPos + 15);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...grayText);
        pdf.text(`Total Rooms: ${roomAnalyses.length} | Type: ${analysisResult?.floorPlanType || 'Residential'}`, margin + 60, yPos + 25);
        pdf.text(`Excellent Placements: ${excellentRooms} | Critical Issues: ${poorRooms}`, margin + 60, yPos + 33);
        pdf.text(`North Direction: ${northPos ? 'Configured' : 'Not Set'}`, margin + 60, yPos + 41);

        yPos += 60;

        // Stats
        const statsWidth = (contentWidth - 10) / 3;
        [
            { label: 'Excellent', value: excellentRooms, color: [34, 197, 94] },
            { label: 'Acceptable', value: roomAnalyses.filter(r => r.analysis.score > 25 && r.analysis.score < 80).length, color: [234, 179, 8] },
            { label: 'Critical', value: poorRooms, color: [239, 68, 68] }
        ].forEach((stat, i) => {
            const x = margin + i * (statsWidth + 5);
            pdf.setFillColor(...stat.color);
            pdf.roundedRect(x, yPos, statsWidth, 22, 2, 2, 'F');
            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(18);
            pdf.setFont('helvetica', 'bold');
            pdf.text(`${stat.value}`, x + statsWidth / 2, yPos + 11, { align: 'center' });
            pdf.setFontSize(9);
            pdf.text(stat.label, x + statsWidth / 2, yPos + 18, { align: 'center' });
        });

        yPos += 32;

        // Quick summary table
        pdf.setTextColor(...darkText);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Room Summary', margin, yPos);
        yPos += 6;

        pdf.setFillColor(17, 24, 39);
        pdf.rect(margin, yPos, contentWidth, 8, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(8);
        pdf.text('Room', margin + 3, yPos + 5);
        pdf.text('Direction', margin + 55, yPos + 5);
        pdf.text('Element', margin + 85, yPos + 5);
        pdf.text('Status', margin + 115, yPos + 5);
        pdf.text('Score', margin + 155, yPos + 5);
        yPos += 9;

        roomAnalyses.forEach((room, i) => {
            if (yPos > 275) { pdf.addPage(); yPos = margin; }
            if (i % 2 === 0) { pdf.setFillColor(249, 250, 251); pdf.rect(margin, yPos - 1, contentWidth, 8, 'F'); }

            pdf.setTextColor(...darkText);
            pdf.setFontSize(8);
            pdf.setFont('helvetica', 'normal');
            pdf.text(room.type.substring(0, 20), margin + 3, yPos + 4);

            const rgb = hexToRgb(room.analysis.color);
            pdf.setFillColor(rgb.r, rgb.g, rgb.b);
            pdf.roundedRect(margin + 53, yPos, 20, 6, 1, 1, 'F');
            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(7);
            pdf.text(room.direction, margin + 63, yPos + 4, { align: 'center' });

            pdf.setTextColor(...grayText);
            pdf.setFontSize(8);
            pdf.text(room.analysis.element || '-', margin + 85, yPos + 4);
            pdf.setTextColor(rgb.r, rgb.g, rgb.b);
            pdf.setFont('helvetica', 'bold');
            pdf.text(room.analysis.status, margin + 115, yPos + 4);
            pdf.setTextColor(...darkText);
            pdf.text(`${room.analysis.score}/100`, margin + 155, yPos + 4);
            yPos += 8;
        });

        // ==================== PAGE 2+: DETAILED ROOM ANALYSIS ====================
        pdf.addPage();
        yPos = margin;

        pdf.setFillColor(17, 24, 39);
        pdf.rect(0, 0, pageWidth, 18, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Detailed Room Analysis', pageWidth / 2, 12, { align: 'center' });
        yPos = 25;

        roomAnalyses.forEach((room, index) => {
            if (yPos > 230) { pdf.addPage(); yPos = margin; }

            const rgb = hexToRgb(room.analysis.color);
            const cardHeight = 55;

            // Card
            pdf.setDrawColor(rgb.r, rgb.g, rgb.b);
            pdf.setLineWidth(0.8);
            pdf.roundedRect(margin, yPos, contentWidth, cardHeight, 3, 3, 'S');
            pdf.setFillColor(rgb.r, rgb.g, rgb.b);
            pdf.rect(margin, yPos, 5, cardHeight, 'F');

            // Header
            pdf.setTextColor(...darkText);
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'bold');
            pdf.text(`${index + 1}. ${room.type}`, margin + 10, yPos + 7);

            pdf.setFillColor(rgb.r, rgb.g, rgb.b);
            pdf.roundedRect(margin + 75, yPos + 2, 25, 8, 2, 2, 'F');
            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(10);
            pdf.text(room.direction, margin + 87.5, yPos + 7.5, { align: 'center' });

            pdf.setTextColor(rgb.r, rgb.g, rgb.b);
            pdf.setFontSize(10);
            pdf.text(`${room.analysis.status} (${room.analysis.score}/100)`, margin + 110, yPos + 7);

            // Details row
            pdf.setTextColor(...grayText);
            pdf.setFontSize(8);
            pdf.text(`Element: ${room.analysis.element || '-'} | Planet: ${room.analysis.planet || '-'}`, margin + 10, yPos + 15);

            if (room.analysis.colors?.length) {
                pdf.text(`Ideal Colors: ${room.analysis.colors.slice(0, 3).join(', ')}`, margin + 100, yPos + 15);
            }

            // Effects
            pdf.setTextColor(...darkText);
            pdf.setFontSize(7);
            let effectY = yPos + 22;
            (room.analysis.effects || []).slice(0, 3).forEach(effect => {
                if (effect) {
                    pdf.text(`• ${effect.substring(0, 90)}`, margin + 10, effectY);
                    effectY += 5;
                }
            });

            // Remedies (if score < 60)
            if (room.analysis.score < 60 && room.analysis.remedies?.length) {
                pdf.setTextColor(22, 101, 52);
                pdf.setFontSize(7);
                pdf.setFont('helvetica', 'bold');
                pdf.text('Remedies:', margin + 10, yPos + 42);
                pdf.setFont('helvetica', 'normal');
                (room.analysis.remedies || []).slice(0, 2).forEach((remedy, ri) => {
                    pdf.text(`${ri + 1}. ${remedy.substring(0, 80)}`, margin + 10, yPos + 47 + ri * 4);
                });
            }

            // Avoid colors
            if (room.analysis.avoid?.length) {
                pdf.setTextColor(185, 28, 28);
                pdf.setFontSize(6);
                pdf.text(`Avoid: ${room.analysis.avoid.join(', ')}`, margin + 140, yPos + 42);
            }

            yPos += cardHeight + 5;
        });

        // ==================== FINAL PAGE: RECOMMENDATIONS ====================
        pdf.addPage();
        yPos = margin;

        pdf.setFillColor(17, 24, 39);
        pdf.rect(0, 0, pageWidth, 18, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Recommendations & Vastu Guidelines', pageWidth / 2, 12, { align: 'center' });
        yPos = 25;

        // Critical issues
        const criticalRooms = roomAnalyses.filter(r => r.analysis.score <= 25);
        if (criticalRooms.length > 0) {
            pdf.setFillColor(254, 226, 226);
            const boxH = 12 + criticalRooms.length * 20;
            pdf.roundedRect(margin, yPos, contentWidth, boxH, 2, 2, 'F');
            pdf.setTextColor(153, 27, 27);
            pdf.setFontSize(11);
            pdf.setFont('helvetica', 'bold');
            pdf.text('CRITICAL ISSUES - Immediate Attention Required', margin + 5, yPos + 7);
            yPos += 14;

            criticalRooms.forEach(room => {
                pdf.setTextColor(127, 29, 29);
                pdf.setFontSize(9);
                pdf.setFont('helvetica', 'bold');
                pdf.text(`${room.type} in ${room.direction} (${room.analysis.zone})`, margin + 5, yPos);
                pdf.setFont('helvetica', 'normal');
                pdf.setFontSize(7);
                pdf.setTextColor(107, 114, 128);
                pdf.text((room.analysis.effects?.[0] || '').substring(0, 80), margin + 5, yPos + 5);
                pdf.setTextColor(22, 101, 52);
                pdf.text('Remedy: ' + (room.analysis.remedies?.[0] || 'Consult expert').substring(0, 70), margin + 5, yPos + 10);
                yPos += 18;
            });
            yPos += 5;
        }

        // Good placements
        const goodRooms = roomAnalyses.filter(r => r.analysis.score >= 80);
        if (goodRooms.length > 0 && yPos < 220) {
            pdf.setFillColor(220, 252, 231);
            pdf.roundedRect(margin, yPos, contentWidth, 10 + Math.min(goodRooms.length, 4) * 7, 2, 2, 'F');
            pdf.setTextColor(22, 101, 52);
            pdf.setFontSize(11);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Excellent Placements - Well Done!', margin + 5, yPos + 7);
            yPos += 12;
            goodRooms.slice(0, 4).forEach(room => {
                pdf.setFontSize(8);
                pdf.setFont('helvetica', 'normal');
                pdf.text(`✓ ${room.type} in ${room.direction} - ${room.analysis.zone}`, margin + 5, yPos);
                yPos += 7;
            });
            yPos += 8;
        }

        // Guidelines
        if (yPos < 200) {
            pdf.setTextColor(...darkText);
            pdf.setFontSize(11);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Essential Vastu Guidelines', margin, yPos);
            yPos += 8;

            [
                'NE Corner (Ishan): Keep sacred, clean, light. Ideal for prayer room. Never toilet/kitchen here.',
                'SE Corner (Agni): Fire element zone. Best for kitchen. Stove facing East is ideal.',
                'SW Corner (Nairritya): Earth element. Heaviest zone. Master bedroom ideal here.',
                'NW Corner (Vayavya): Air element. Best for toilet/bathroom. Guest room acceptable.',
                'Center (Brahmasthan): Keep open and clutter-free. Core energy point of house.',
                'Main Entry: N, NE, E entries most auspicious. SW entry least favorable.',
                'Water Features: Only in N, NE, or E. Never in S, SE, SW, or W.',
                'Sleeping: Head towards S or E. Never towards N (magnetic field issues).'
            ].forEach(tip => {
                if (yPos < 275) {
                    pdf.setFillColor(249, 250, 251);
                    pdf.roundedRect(margin, yPos, contentWidth, 8, 1, 1, 'F');
                    pdf.setTextColor(...grayText);
                    pdf.setFontSize(7);
                    pdf.text(`• ${tip}`, margin + 3, yPos + 5);
                    yPos += 9;
                }
            });
        }

        // Footer
        const totalPages = pdf.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            pdf.setPage(i);
            pdf.setFillColor(17, 24, 39);
            pdf.rect(0, 287, pageWidth, 10, 'F');
            pdf.setTextColor(156, 163, 175);
            pdf.setFontSize(7);
            pdf.text('AI Vastu Analyse - Powered by Gemini AI | For guidance only - Consult Vastu expert for remedies', pageWidth / 2, 293, { align: 'center' });
            pdf.text(`Page ${i}/${totalPages}`, pageWidth - margin, 293, { align: 'right' });
        }

        pdf.save('Vastu_Complete_Analysis_Report.pdf');
        console.log('PDF generated successfully!');
    } catch (error) {
        console.error('PDF Error:', error);
        alert('Error: ' + error.message);
    }
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : { r: 100, g: 100, b: 100 };
}

export { analyzeRoomPlacement, getVastuDetails };
