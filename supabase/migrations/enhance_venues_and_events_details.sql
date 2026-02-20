-- ═══════════════════════════════════════════════════════════════════════
-- ENHANCE VENUES AND EVENTS WITH DETAILED INFORMATION
-- ═══════════════════════════════════════════════════════════════════════
-- Adds comprehensive descriptions, facilities, and context
-- Date: December 15, 2025

BEGIN;

-- ═══════════════════════════════════════════════════════════════════════
-- PART 1: ENHANCE VENUE DESCRIPTIONS
-- ═══════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────
-- Strathmore University
-- ───────────────────────────────────────────────────────────────────────
UPDATE venues
SET
  description = '<h2>About Strathmore University</h2>
<p>Strathmore University is a leading Kenyan university, inspired by the values of unity, generosity and respect for the dignity of work. Located in Nairobi, Kenya, the university has grown to become a premier institution of higher learning in East Africa.</p>

<h3>History & Excellence</h3>
<p>Founded in 1961 as the first advanced-level sixth form college offering British A-level courses, Strathmore has evolved into a fully-fledged university with a charter granted in 2008. The university is known for its academic rigor, innovative teaching methods, and strong industry partnerships.</p>

<h3>Academic Programs</h3>
<p>Strathmore offers a wide range of undergraduate and postgraduate programs across multiple faculties including:</p>
<ul>
<li>Faculty of Information Technology - offering BSc Computing, Information Technology, and related programs</li>
<li>Strathmore Business School - consistently ranked among Africa''s top business schools</li>
<li>Faculty of Engineering - with cutting-edge laboratories and research facilities</li>
<li>Faculty of Science - including Data Science and Analytics programs</li>
</ul>

<h3>Research & Innovation</h3>
<p>The university hosts several research centers including the @iLabAfrica research and innovation center, which focuses on technology innovation, ICT solutions, and digital transformation in Africa. This makes it an ideal venue for AI and technology conferences.</p>

<h3>Conference Facilities</h3>
<p>Strathmore''s modern campus features state-of-the-art conference facilities including:</p>
<ul>
<li>Multiple lecture halls with capacities ranging from 50 to 500 people</li>
<li>Advanced audio-visual equipment and live streaming capabilities</li>
<li>High-speed WiFi throughout campus</li>
<li>Breakout rooms for workshops and parallel sessions</li>
<li>Modern cafeteria and catering services</li>
<li>Ample parking space for attendees</li>
<li>On-campus accommodation options</li>
</ul>

<h3>Location & Accessibility</h3>
<p>Located in the Madaraka Estate along Ole Sangale Road, Strathmore is easily accessible from Nairobi city center and Jomo Kenyatta International Airport. The campus is well-served by public transport and major highways.</p>

<h3>Why Choose Strathmore for Events</h3>
<p>Strathmore University provides a professional, academic atmosphere perfect for conferences and seminars. The combination of modern facilities, technological infrastructure, and experienced event support staff ensures successful events. The university''s commitment to innovation and technology makes it particularly suitable for AI and tech conferences.</p>',

  facilities = ARRAY[
    'Conference Halls (50-500 capacity)',
    'Lecture Rooms',
    'High-Speed WiFi',
    'Parking (500+ vehicles)',
    'Catering Services',
    'Audio-Visual Equipment',
    'Live Streaming Capabilities',
    'Breakout Rooms',
    'On-Campus Accommodation',
    '@iLabAfrica Innovation Center',
    'Computer Labs',
    'Accessibility Features'
  ]::text[]

WHERE slug = 'strathmore-university';

-- ───────────────────────────────────────────────────────────────────────
-- Dedan Kimathi University of Technology
-- ───────────────────────────────────────────────────────────────────────
UPDATE venues
SET
  description = '<h2>About Dedan Kimathi University of Technology</h2>
<p>Dedan Kimathi University of Technology (DeKUT) is a public, coeducational technological university in Nyeri, Kenya. The university has established itself as a center of excellence in engineering, technology, and applied sciences.</p>

<h3>History & Mission</h3>
<p>Originally established in 1972 as the Kimathi Institute of Technology, the institution was upgraded to university status in 2012. Named after freedom fighter Dedan Kimathi Waciuri, the university embodies the spirit of innovation, determination, and excellence.</p>

<h3>Academic Excellence</h3>
<p>DeKUT specializes in technology-focused education and research:</p>
<ul>
<li><strong>School of Engineering:</strong> Offering programs in Electrical, Mechanical, Civil, and Mechatronic Engineering</li>
<li><strong>School of Computer Science & Information Technology:</strong> Home to AI and Machine Learning programs</li>
<li><strong>School of Pure and Applied Sciences:</strong> Including Mathematics, Statistics, and Data Science</li>
<li><strong>School of Business:</strong> Technology-focused business programs</li>
</ul>

<h3>AI & Technology Focus</h3>
<p>DeKUT has become a hub for AI research and education in Kenya:</p>
<ul>
<li>Active research in Machine Learning and Artificial Intelligence</li>
<li>Partnerships with international AI research institutions</li>
<li>Regular hosting of tech competitions and hackathons</li>
<li>Strong collaboration between academia and industry</li>
<li>Faculty members actively involved in AI research and publications</li>
</ul>

<h3>Conference & Event Facilities</h3>
<p>The university offers comprehensive facilities for conferences and academic events:</p>
<ul>
<li>Main Conference Hall - capacity 800 people</li>
<li>Multiple lecture theaters (100-300 capacity each)</li>
<li>State-of-the-art computer laboratories for hackathons and workshops</li>
<li>Innovation and incubation centers</li>
<li>High-speed internet connectivity across campus</li>
<li>Modern audio-visual systems with recording capabilities</li>
<li>Student hostels for event accommodation</li>
<li>Multiple catering facilities and dining halls</li>
</ul>

<h3>Location & Environment</h3>
<p>Located in Nyeri town, approximately 150km north of Nairobi, DeKUT sits at the foothills of Mount Kenya. The serene environment provides an ideal setting for focused academic events and conferences. The town of Nyeri is well-connected by road and offers various accommodation options.</p>

<h3>Perfect for Tech Events</h3>
<p>DeKUT''s strong technology orientation, modern facilities, and experienced event management team make it an excellent choice for AI conferences, hackathons, and technology workshops. The university has successfully hosted multiple IndabaX Kenya events, demonstrating its capability in managing large-scale tech conferences.</p>',

  facilities = ARRAY[
    'Conference Halls (up to 800 capacity)',
    'Computer Labs (40+ machines each)',
    'Lecture Theaters',
    'High-Speed WiFi Campus-Wide',
    'Parking',
    'Accommodation (Student Hostels)',
    'Hackathon Space',
    'Innovation Centers',
    'Audio-Visual Equipment',
    'Recording Facilities',
    'Multiple Dining Halls',
    'Research Laboratories',
    'Sports Facilities',
    'Medical Center'
  ]::text[]

WHERE slug = 'dedan-kimathi-university';

-- ───────────────────────────────────────────────────────────────────────
-- Maseno University
-- ───────────────────────────────────────────────────────────────────────
UPDATE venues
SET
  description = '<h2>About Maseno University</h2>
<p>Maseno University is a vibrant public university located in Maseno, Kenya, along the Kisumu-Busia highway. Established in 1991, it has grown to become one of Kenya''s premier universities with a strong commitment to academic excellence, research, and community service.</p>

<h3>History & Development</h3>
<p>Maseno University traces its roots to the Maseno School, established in 1906 by the Church Missionary Society. The university achieved full university status in 2001 and has since expanded significantly in both academic programs and infrastructure. It serves as a major educational hub for Western Kenya and the Lake Victoria region.</p>

<h3>Academic Programs</h3>
<p>The university offers diverse programs across multiple schools:</p>
<ul>
<li><strong>School of Computing and Informatics:</strong> Offering Computer Science, Information Technology, and emerging technology programs</li>
<li><strong>School of Mathematics, Statistics and Actuarial Science:</strong> Including Data Science specializations</li>
<li><strong>School of Public Health and Community Development:</strong> Focusing on health informatics and technology</li>
<li><strong>School of Business and Economics:</strong> With programs in digital economics and fintech</li>
<li><strong>School of Engineering:</strong> Developing technology solutions for local challenges</li>
</ul>

<h3>Research & Innovation</h3>
<p>Maseno University is actively engaged in research that addresses local and regional challenges:</p>
<ul>
<li>ICT research focusing on solutions for rural and underserved communities</li>
<li>Collaborative research with international institutions</li>
<li>Strong emphasis on applied research and innovation</li>
<li>Growing focus on AI applications in agriculture, health, and governance</li>
<li>Partnerships with government agencies and NGOs</li>
</ul>

<h3>Conference Facilities</h3>
<p>Maseno University provides excellent facilities for hosting academic and professional events:</p>
<ul>
<li>Main Auditorium - capacity 1,000+ people</li>
<li>Multiple lecture halls (50-300 capacity)</li>
<li>Modern seminar rooms for breakout sessions</li>
<li>Computer laboratories with internet connectivity</li>
<li>Conference center with full multimedia support</li>
<li>Catering services and dining facilities</li>
<li>On-campus guest houses and student accommodation</li>
<li>Extensive parking facilities</li>
</ul>

<h3>Location & Regional Significance</h3>
<p>Located approximately 20km from Kisumu city (Kenya''s third-largest city), Maseno University serves the Lake Victoria region. The location makes it accessible to participants from Western Kenya, Uganda, and Tanzania. Kisumu has an international airport with regular flights from Nairobi.</p>

<h3>Community Engagement</h3>
<p>The university has strong ties with local communities and government institutions, making it an ideal venue for events focused on governance, democracy, and civic technology. Its location in Western Kenya brings geographic diversity to conference locations and allows engagement with communities outside Nairobi.</p>

<h3>Ideal for Policy & Governance Events</h3>
<p>Maseno''s academic strengths, community connections, and modern facilities make it particularly suitable for conferences addressing AI in governance, policy, and democracy. The university''s commitment to community service aligns well with events focused on technology for social good.</p>',

  facilities = ARRAY[
    'Main Auditorium (1000+ capacity)',
    'Conference Center',
    'Lecture Halls',
    'Seminar Rooms',
    'Computer Laboratories',
    'WiFi Connectivity',
    'Multimedia Equipment',
    'Catering Services',
    'Guest Houses',
    'Student Accommodation',
    'Parking Facilities',
    'Sports Facilities',
    'Library & Study Spaces',
    'Medical Services'
  ]::text[]

WHERE slug = 'maseno-university';

-- ═══════════════════════════════════════════════════════════════════════
-- PART 2: ENHANCE EVENT DESCRIPTIONS
-- ═══════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────
-- IndabaX Kenya 2022 - Enhanced Description
-- ───────────────────────────────────────────────────────────────────────
UPDATE events
SET description = '<h2>IndabaX Kenya 2022: AI for Smart Cities</h2>
<p>The 2022 edition of IndabaX Kenya marked a significant milestone in bringing together Kenya''s AI community to explore how artificial intelligence can transform urban life. Held at Strathmore University from December 15-17, 2022, this three-day conference brought together over 300 participants including researchers, students, industry practitioners, and policymakers.</p>

<h3>Conference Theme: AI for Smart Cities</h3>
<p>With rapid urbanization across Africa, the 2022 conference focused on how AI can address urban challenges in Kenyan cities. The event explored practical applications of machine learning and AI in:</p>
<ul>
<li><strong>Traffic Management:</strong> Using computer vision and predictive analytics to optimize traffic flow in Nairobi</li>
<li><strong>Energy Efficiency:</strong> Smart grid technology and AI-powered energy management systems</li>
<li><strong>Waste Management:</strong> Route optimization and waste prediction using machine learning</li>
<li><strong>Public Safety:</strong> AI applications in emergency response and crime prevention</li>
<li><strong>Urban Planning:</strong> Using satellite imagery and AI for city planning and development</li>
<li><strong>Public Services:</strong> AI chatbots and automation for citizen services</li>
</ul>

<h3>Event Highlights</h3>

<p><strong>Keynote Presentations</strong></p>
<ul>
<li>Opening keynote on "The Future of Smart Cities in Africa" by leading urban technology experts</li>
<li>Technical talks on computer vision applications for traffic monitoring</li>
<li>Case studies from Nairobi''s smart city initiatives</li>
<li>International speakers sharing experiences from smart city projects globally</li>
</ul>

<p><strong>Technical Workshops</strong></p>
<ul>
<li>Hands-on workshop on satellite imagery analysis using Python and TensorFlow</li>
<li>Introduction to IoT and sensor networks for smart cities</li>
<li>Machine learning for urban data analysis</li>
<li>Deep learning fundamentals for beginners</li>
</ul>

<p><strong>Research Presentations</strong></p>
<p>Over 20 research papers were presented, showcasing work from Kenyan universities and research institutions on topics including:</p>
<ul>
<li>Predictive models for traffic congestion in Nairobi</li>
<li>AI for water distribution optimization</li>
<li>Smart parking solutions using machine learning</li>
<li>Air quality monitoring and prediction</li>
</ul>

<h3>Networking & Community Building</h3>
<p>The conference provided extensive networking opportunities:</p>
<ul>
<li>Poster sessions showcasing student and early-career researcher work</li>
<li>Industry exhibition featuring local tech companies and startups</li>
<li>Panel discussions on AI careers and opportunities in Kenya</li>
<li>Evening social events for informal networking</li>
<li>Mentorship sessions connecting students with experienced practitioners</li>
</ul>

<h3>Impact & Outcomes</h3>
<ul>
<li><strong>300+ attendees</strong> from universities, industry, and government</li>
<li><strong>50+ students</strong> received hands-on training in AI techniques</li>
<li><strong>20+ research papers</strong> presented</li>
<li><strong>15+ organizations</strong> participated in the industry exhibition</li>
<li>Formation of working groups on specific smart city challenges</li>
<li>Partnerships established between researchers and city authorities</li>
</ul>

<h3>Partner Organizations</h3>
<p>The event was supported by Strathmore University, Nairobi City County government, and various technology companies committed to advancing AI applications in urban contexts.</p>

<h3>Legacy</h3>
<p>IndabaX Kenya 2022 established smart cities as a key application area for AI in Kenya, leading to ongoing collaborations between universities, government agencies, and the private sector. Several pilot projects in traffic management and public services were initiated following discussions at the conference.</p>

<blockquote>
<p>"This conference opened our eyes to the practical possibilities of AI in making our cities more livable and efficient. The networking alone was worth the trip from Mombasa!" - Participant feedback</p>
</blockquote>'
WHERE slug = 'indabax-kenya-2022';

-- ───────────────────────────────────────────────────────────────────────
-- IndabaX Kenya 2023 - Enhanced Description
-- ───────────────────────────────────────────────────────────────────────
UPDATE events
SET description = '<h2>IndabaX Kenya 2023: Innovation Through Collaboration</h2>
<p>IndabaX Kenya 2023 brought a fresh and exciting dimension to the annual conference by introducing the first-ever IndabaX Kenya Hackathon. Held at Dedan Kimathi University of Technology in Nyeri from July 12-14, 2023, this edition attracted over 400 participants and emphasized hands-on problem-solving and collaborative innovation.</p>

<h3>Conference Theme: Innovation Through Collaboration</h3>
<p>The 2023 edition recognized that the most impactful AI solutions emerge from collaborative efforts bringing together diverse perspectives and skills. The conference fostered partnerships between:</p>
<ul>
<li>Academic researchers and industry practitioners</li>
<li>Students and experienced professionals</li>
<li>Technical experts and domain specialists (healthcare, agriculture, education)</li>
<li>Kenyan innovators and international AI community members</li>
</ul>

<h3>The IndabaX Kenya Hackathon - A Historic First</h3>

<p><strong>24-Hour Innovation Challenge</strong></p>
<p>The centerpiece of the 2023 event was the first IndabaX Kenya Hackathon, where 80+ participants formed teams to develop AI solutions addressing real-world challenges:</p>

<p><em>Challenge Tracks:</em></p>
<ul>
<li><strong>Agriculture Track:</strong> Develop AI solutions for crop disease detection, yield prediction, or farm management</li>
<li><strong>Healthcare Track:</strong> Create AI tools for disease diagnosis, patient triage, or health data analysis</li>
<li><strong>Education Track:</strong> Build AI applications for personalized learning, assessment, or educational content</li>
</ul>

<p><strong>Hackathon Highlights:</strong></p>
<ul>
<li>20 teams competed across three tracks</li>
<li>Provided datasets and API access to cloud computing resources</li>
<li>Mentorship from industry experts throughout the event</li>
<li>Live coding sessions in DeKUT''s state-of-the-art computer labs</li>
<li>Prize money totaling KES 300,000 for winning solutions</li>
</ul>

<p><strong>Winning Solutions:</strong></p>
<ul>
<li><em>1st Place (Agriculture):</em> Mobile app using computer vision to identify maize diseases from photos, achieving 92% accuracy</li>
<li><em>1st Place (Healthcare):</em> AI model for predicting malaria risk based on environmental and demographic data</li>
<li><em>1st Place (Education):</em> Adaptive learning platform that personalizes mathematics content based on student performance</li>
</ul>

<h3>Technical Program</h3>

<p><strong>Workshops & Tutorials</strong></p>
<ul>
<li>Deep Learning with PyTorch - From basics to deployment</li>
<li>Natural Language Processing for African languages</li>
<li>Computer Vision applications in agriculture</li>
<li>MLOps: Deploying and maintaining ML systems in production</li>
<li>Ethics and bias in AI systems</li>
</ul>

<p><strong>Keynote Speakers</strong></p>
<ul>
<li>International AI researchers presenting on latest advances in deep learning</li>
<li>Local tech entrepreneurs sharing their AI startup journeys</li>
<li>Government officials discussing AI policy and digital transformation</li>
<li>University professors presenting cutting-edge research</li>
</ul>

<p><strong>Research Presentations</strong></p>
<p>30+ research presentations covering:</p>
<ul>
<li>AI for precision agriculture</li>
<li>Medical image analysis using deep learning</li>
<li>Natural language processing for low-resource languages</li>
<li>Reinforcement learning applications</li>
<li>AI ethics and fairness</li>
</ul>

<h3>Industry Engagement</h3>
<p>The conference featured strong industry participation:</p>
<ul>
<li>Tech company exhibits showcasing AI products and services</li>
<li>Recruitment fair with companies seeking AI talent</li>
<li>Startup pitch sessions for AI-focused ventures</li>
<li>Corporate sponsors providing mentorship and resources for hackathon</li>
</ul>

<h3>Impact & Statistics</h3>
<ul>
<li><strong>400+ participants</strong> including students, researchers, and professionals</li>
<li><strong>80+ hackathon participants</strong> in 20 teams</li>
<li><strong>100+ students</strong> trained in hands-on AI workshops</li>
<li><strong>30+ research presentations</strong></li>
<li><strong>20+ partner organizations</strong> including universities, companies, and NGOs</li>
<li><strong>3 hackathon winning teams</strong> received funding and mentorship to continue development</li>
</ul>

<h3>Community Building</h3>
<p>The event strengthened Kenya''s AI community through:</p>
<ul>
<li>Formation of IndabaX Kenya alumni network</li>
<li>Establishment of regional AI study groups</li>
<li>Mentorship program connecting students with practitioners</li>
<li>Collaboration agreements between universities</li>
</ul>

<h3>Media Coverage</h3>
<p>IndabaX Kenya 2023 received significant media attention, with coverage in national newspapers, tech blogs, and university publications, raising awareness of AI developments in Kenya.</p>

<blockquote>
<p>"The hackathon was intense but incredibly rewarding. We built something real that could help farmers, and we''re now working to deploy it!" - Hackathon winner</p>
</blockquote>

<h3>Looking Forward</h3>
<p>The success of the 2023 hackathon established it as a core component of future IndabaX Kenya events, demonstrating the power of hands-on, collaborative problem-solving in AI education and innovation.</p>'
WHERE slug = 'indabax-kenya-2023';

COMMIT;

-- Verify updates
SELECT slug, LENGTH(description) as description_length, array_length(facilities, 1) as facility_count
FROM venues
WHERE slug IN ('strathmore-university', 'dedan-kimathi-university', 'maseno-university')
ORDER BY slug;

SELECT slug, event_year, LENGTH(description) as description_length
FROM events
WHERE slug IN ('indabax-kenya-2022', 'indabax-kenya-2023')
ORDER BY event_year;
