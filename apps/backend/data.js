const skills = {
    softwareDevelopment: [
        "C++", "Java", "C#", "Python", "Go", "Rust", "Kotlin", "Swift", "Scala", "Ruby", 
        "PHP", "TypeScript", "JavaScript", "Object-Oriented Programming (OOP)", "Functional Programming", 
        "Design Patterns", "Data Structures", "Algorithms", "System Design", "Microservices", 
        "Service-Oriented Architecture (SOA)", "RESTful APIs", "GraphQL", "gRPC", "WebSockets", 
        "API Design", "Docker", "Kubernetes", "Git", "SVN", "GitHub Actions", "GitLab CI", 
        "Jenkins", "CircleCI", "NPM", "Yarn", "PNPM", "Vite", "Webpack", "Babel", 
        "SOLID Principles", "Domain-Driven Design (DDD)", "Test-Driven Development (TDD)", 
        "Behavior-Driven Development (BDD)", "Clean Code", "Clean Architecture", "Monorepo Architecture", 
        "Asynchronous Programming", "Multithreading", "Concurrency", "Shell Scripting", "Bash", 
        "PowerShell", "Linux Administration", "MVC Pattern", "MVVM Pattern", "Debugging", 
        "Code Refactoring", "Memory Management", "UML Modeling", "Design Principles"
    ],
    webDevelopment: [
        "HTML5", "CSS3", "JavaScript ES6+", "React.js", "Angular", "Vue.js", "Svelte", 
        "Next.js", "Nuxt.js", "Gatsby", "Remix", "Tailwind CSS", "Bootstrap", "Sass", 
        "LESS", "Styled Components", "CSS Modules", "Responsive Web Design", "CSS Grid", 
        "Flexbox", "DOM Manipulation", "AJAX", "Fetch API", "Axios", "Redux", "Zustand", 
        "MobX", "Recoil", "React Query", "React Router", "Node.js", "Express.js", "NestJS", 
        "Fastify", "Django", "Flask", "Ruby on Rails", "Laravel", "Spring Boot", "ASP.NET Core", 
        "Web Security (OWASP Top 10)", "CORS", "JWT", "OAuth 2.0", "HTTPS", "SSL/TLS", 
        "Web Accessibility (WCAG, WAI-ARIA)", "Lighthouse Auditing", "Progressive Web Apps (PWA)", 
        "Service Workers", "Static Site Generation (SSG)", "Server-Side Rendering (SSR)", 
        "Jamstack", "Headless CMS", "WordPress", "Shopify Development", "Web Performance Optimization", 
        "Lazy Loading", "Code Splitting", "SEO for Web", "Browser Developer Tools"
    ],
    mobileDevelopment: [
        "Swift", "SwiftUI", "Objective-C", "Kotlin", "Java (Android)", "Jetpack Compose", 
        "React Native", "Flutter", "Xamarin", "Android SDK", "iOS SDK", "Xcode", 
        "Android Studio", "App Store Connect", "Google Play Console", "CocoaPods", "SPM", 
        "Gradle", "Mobile UI/UX", "Mobile Performance Optimization", "SQLite", "Realm", 
        "Room Database", "CoreData", "Push Notifications (FCM, APNs)", "Deep Linking", 
        "Mobile State Management", "Location Services", "Geofencing", "App Store Optimization (ASO)", 
        "Mobile Security", "Keystore", "Keychain", "Fastlane", "Appium", "WatchOS Development", 
        "WearOS Development", "In-App Purchases (IAP)", "Apple Pay Integration", 
        "Google Pay Integration", "Native Modules", "Expo CLI", "React Native CLI", 
        "WatchKit", "Mobile Testing", "Codemagic", "Bitrise", "iPadOS Optimization"
    ],
    gameDevelopment: [
        "Unity", "Unreal Engine", "Godot", "CryEngine", "C# (Unity)", "C++ (Unreal)", 
        "GDScript", "Blender", "Maya", "3D Game Design", "2D Game Design", "Game Physics", 
        "Collision Detection", "Pathfinding (A*)", "AI for Games", "Shader Development", 
        "HLSL/GLSL", "Shader Graph", "Ray Tracing", "Render Pipelines (URP, HDRP)", "Level Design", 
        "Character Controller", "Particle Systems", "VFX Graph", "Wwise", "FMOD", 
        "Multiplayer Game Programming", "Socket.io", "Photon Engine", "Mirror Networking", 
        "Game Optimization", "Asset Bundles", "Game Testing", "Playtesting", "Steamworks SDK", 
        "Oculus SDK", "ARKit", "ARCore", "Game Loop", "State Machine", "Linear Algebra for 3D", 
        "Rigging", "Sprite Animation", "Look Dev", "Virtual Reality (VR)", "Augmented Reality (AR)"
    ],
    cloudDevOps: [
        "Amazon Web Services (AWS)", "Microsoft Azure", "Google Cloud Platform (GCP)", 
        "Terraform", "Ansible", "AWS CloudFormation", "Pulumi", "Kubernetes", "Docker", 
        "Docker Compose", "Jenkins", "GitLab CI/CD", "GitHub Actions", "CircleCI", "Helm", 
        "ArgoCD", "Prometheus", "Grafana", "ELK Stack", "Splunk", "Datadog", "New Relic", 
        "Linux Systems", "Bash Scripting", "Python Scripting", "Serverless Architecture", 
        "AWS Lambda", "Azure Functions", "Google Cloud Functions", "Infrastructure as Code (IaC)", 
        "CI/CD Pipelines", "Service Mesh (Istio)", "HashiCorp Vault", "Nginx", "Apache HTTP Server", 
        "HAProxy", "Load Balancing", "Cloudflare CDN", "AWS CloudFront", "Virtual Private Cloud (VPC)", 
        "IAM", "Site Reliability Engineering (SRE)", "Disaster Recovery Planning", "High Availability"
    ],
    cybersecurity: [
        "Penetration Testing", "Ethical Hacking", "Vulnerability Assessment", "Network Security", 
        "Application Security", "Cloud Security", "Information Security (InfoSec)", "Cryptography", 
        "Encryption", "Hashing", "SSL/TLS", "Firewalls", "IDS/IPS", "SIEM", "Incident Response", 
        "Digital Forensics", "Malware Analysis", "Reverse Engineering", "Wireshark", "Metasploit", 
        "Nmap", "Burp Suite", "Kali Linux", "OWASP Top 10", "Threat Modeling", "IAM", "MFA", 
        "Zero Trust Architecture", "CISSP", "CEH", "Security+", "CISM", "ISO 27001", "SOC 2", 
        "GDPR Compliance", "HIPAA Compliance", "PCI-DSS Compliance", "Security Auditing", 
        "Social Engineering Defense", "Phishing Simulation", "Endpoint Security", "EDR", "DLP", 
        "Active Directory Security", "DevSecOps", "SIEM Configuration", "Vulnerability Management"
    ],
    dataScience: [
        "Python", "R", "SQL", "Pandas", "NumPy", "Scikit-learn", "TensorFlow", "Keras", 
        "PyTorch", "Jupyter Notebooks", "Exploratory Data Analysis (EDA)", "Statistical Analysis", 
        "Machine Learning", "Deep Learning", "Natural Language Processing (NLP)", "Computer Vision", 
        "Predictive Modeling", "Regression Analysis", "Classification Algorithms", "Clustering (K-Means)", 
        "Dimensionality Reduction (PCA)", "Time Series Analysis", "Data Cleaning", "Data Imputation", 
        "Feature Engineering", "Feature Selection", "Data Visualization", "Matplotlib", "Seaborn", 
        "Tableau", "Power BI", "Apache Spark", "Hadoop", "MapReduce", "Big Data Analytics", 
        "NoSQL Databases", "A/B Testing", "Hypothesis Testing", "Statistical Modeling", "RStudio", 
        "SAS", "MATLAB", "Anaconda", "AWS SageMaker", "Data Pipelines", "ETL Processes", 
        "Data Warehousing", "Data Lake", "MLOps", "MLflow"
    ],
    artificialIntelligence: [
        "Machine Learning", "Deep Learning", "Neural Networks", "CNNs", "RNNs", "LSTMs", 
        "Transformers", "GANs", "Large Language Models (LLMs)", "GPT", "BERT", "Llama", 
        "LangChain", "Hugging Face", "Reinforcement Learning", "Q-Learning", "Computer Vision", 
        "Image Classification", "Object Detection (YOLO)", "Semantic Segmentation", "OpenCV", 
        "NLP", "Sentiment Analysis", "Named Entity Recognition (NER)", "Machine Translation", 
        "Text Generation", "Speech Recognition", "Text-to-Speech (TTS)", "RLHF", "Vector Databases", 
        "Pinecone", "Milvus", "ChromaDB", "Prompt Engineering", "AI Ethics", "Bias Mitigation", 
        "MLOps", "Model Hyperparameter Tuning", "Gradient Descent", "Adam Optimizer", 
        "Edge AI", "TensorRT", "Cognitive Computing", "Genetic Algorithms"
    ],
    databaseEngineering: [
        "SQL", "MySQL", "PostgreSQL", "Oracle Database", "Microsoft SQL Server", "SQLite", 
        "MongoDB", "Cassandra", "Redis", "DynamoDB", "Neo4j", "Firebase Firestore", "MariaDB", 
        "Database Design", "ER Diagramming", "Database Normalization", "Database Indexing", 
        "Query Optimization", "Performance Tuning", "Transaction Management", "ACID Properties", 
        "Database Clustering", "Database Replication", "Database Sharding", "Database Partitioning", 
        "Backup & Recovery", "Data Migration", "ETL (Extract, Transform, Load)", "Data Warehousing", 
        "Snowflake", "Amazon Redshift", "Google BigQuery", "Database Administration (DBA)", 
        "Stored Procedures", "Triggers", "Views", "Functions", "Database Security", 
        "Connection Pooling", "NoSQL Architecture", "Graph Databases", "Document Databases", 
        "Key-Value Stores", "Time Series Databases", "In-Memory Databases", "Database Auditing"
    ],
    qaTesting: [
        "Manual Testing", "Automated Testing", "Selenium", "Cypress", "Playwright", "JUnit", 
        "TestNG", "PyTest", "Mocha", "Jest", "Postman (API Testing)", "SoapUI", "RestAssured", 
        "API Testing", "Mobile Testing", "Appium", "Emulator/Simulator Testing", "Performance Testing", 
        "JMeter", "LoadRunner", "Locust", "Security Testing", "QA Penetration Testing", 
        "Accessibility Testing", "Usability Testing", "Regression Testing", "Smoke Testing", 
        "Sanity Testing", "Functional Testing", "Non-Functional Testing", "Integration Testing", 
        "System Testing", "User Acceptance Testing (UAT)", "Black Box Testing", "White Box Testing", 
        "Gray Box Testing", "Test Planning", "Test Case Writing", "Bug Tracking", "Jira", 
        "Bugzilla", "TestRail", "Zephyr", "CI/CD Test Integration", "QA Methodologies", 
        "QA Audit", "Exploratory Testing", "Defect Lifecycle Management"
    ],

    uiUxDesign: [
        "User Interface (UI) Design", "User Experience (UX) Design", "Figma", "Adobe XD", 
        "Sketch", "InVision", "Wireframing", "Prototyping", "Mockups", "High-Fidelity Design", 
        "Low-Fidelity Design", "User Research", "User Interviews", "Persona Creation", 
        "User Journey Mapping", "Information Architecture (IA)", "Site Mapping", "Usability Testing", 
        "Interaction Design (IxD)", "Visual Design", "Typography", "Color Theory", "Layout Design", 
        "Responsive Design", "Mobile-First Design", "Design Systems", "Component Libraries", 
        "UI Animations", "Micro-interactions", "Heuristic Evaluation", "Accessibility in Design (WCAG)", 
        "User Flows", "Task Flows", "Card Sorting", "Customer Journey Mapping", "Adobe Illustrator", 
        "Adobe Photoshop", "Design Sprints", "UX Writing", "Responsive Web Design (UI/UX)", 
        "Empathy Mapping", "A/B Testing UI", "Moodboarding"
    ],
    graphicDesign: [
        "Adobe Photoshop", "Adobe Illustrator", "Adobe InDesign", "Vector Graphic Design", 
        "Raster Graphic Design", "Branding", "Logo Design", "Visual Identity", "Typography", 
        "Color Theory", "Layout Design", "Print Design", "Digital Illustration", "Banner Design", 
        "Brochure Design", "Flyer Design", "Poster Design", "Packaging Design", "Infographics Design", 
        "Social Media Graphics", "Marketing Graphics", "Vector Tracing", "Photo Manipulation", 
        "Photo Retouching", "Business Card Design", "Presentation Design", "Slide Deck Design", 
        "Book Cover Design", "Magazine Layout", "Signage Design", "Brand Guidelines", 
        "Creative Direction", "Concept Art", "Drawing", "Sketching", "CorelDRAW", "Canva", 
        "Figma (for Graphics)", "T-Shirt Design", "Merchandising Design", "Style Guides", 
        "Image Slicing", "Color Correction", "Photo Editing", "Creative Suite", "Print Production"
    ],
    animation3D: [
        "Blender", "Autodesk Maya", "3ds Max", "Cinema 4D", "ZBrush", "Houdini", "3D Modeling", 
        "Polygon Modeling", "Subdivision Surface Modeling", "Sculpting", "Texturing", "UV Mapping", 
        "Rigging", "Character Rigging", "Face Rigging", "3D Animation", "Character Animation", 
        "Keyframe Animation", "Motion Capture (Mocap) Editing", "Lighting", "Rendering", "V-Ray", 
        "Arnold", "Redshift", "Octane Render", "Compositing", "Adobe After Effects", "VFX", 
        "Fluid Simulation", "Particle Simulation", "Cloth Simulation", "Physics Simulation", 
        "Hard Surface Modeling", "Organic Modeling", "Retopology", "Texture Painting", 
        "Substance Painter", "Substance Designer", "PBR Workflow", "Look Development", 
        "Architectural Visualization (ArchViz)", "Product Rendering", "Game Asset Creation", 
        "Low-Poly Modeling", "High-Poly Modeling"
    ],
    videoEditing: [
        "Adobe Premiere Pro", "Final Cut Pro", "DaVinci Resolve", "Avid Media Composer", 
        "Adobe After Effects (Compositing)", "Sony Vegas Pro", "Video Cut", "Video Assembly", 
        "Timeline Editing", "Color Grading", "Color Correction", "Audio Syncing", "Audio Mixing", 
        "Sound Design", "Title Animation", "Lower Thirds", "Motion Graphics", "Video Transitions", 
        "Keyframing", "Chroma Key (Green Screen)", "Rotoscoping", "Masking", "Video Compression", 
        "Video Codecs (H.264, ProRes)", "Subtitling", "Captioning", "Multi-camera Editing", 
        "Storyboarding", "Video Rendering", "Video Formatting", "YouTube Video Editing", 
        "Social Media Video Editing", "Corporate Video Editing", "Music Video Editing", 
        "Documentary Editing", "Narrative Film Editing", "Promo Video Editing", "Video Auditing", 
        "Footage Organization", "Proxy Workflow", "Aspect Ratio Optimization"
    ],
    photography: [
        "Portrait Photography", "Landscape Photography", "Event Photography", "Wedding Photography", 
        "Product Photography", "Commercial Photography", "Fashion Photography", "Street Photography", 
        "Architectural Photography", "Food Photography", "Photojournalism", "DSLR Camera Operation", 
        "Mirrorless Camera Operation", "Lens Selection", "Exposure Triangle", "Lighting Techniques", 
        "Studio Lighting", "Natural Lighting", "Flash Photography", "Composition Rules", 
        "Adobe Lightroom (Photo Development)", "Adobe Photoshop (Retouching)", "RAW Image Processing", 
        "Color Grading (Photo)", "HDR Photography", "Macro Photography", "Drone Photography", 
        "Aerial Photography", "Image Editing", "Photo Culling", "Studio Setup", "Digital Asset Management", 
        "Photographic Printing", "Image Composition", "Action Photography", "Night Photography"
    ],

    digitalMarketing: [
        "Search Engine Marketing (SEM)", "Pay-Per-Click (PPC)", "Google Ads", "Microsoft Ads", 
        "Meta Ads", "LinkedIn Ads", "Twitter Ads", "TikTok Ads", "Display Advertising", 
        "Remarketing/Retargeting", "Email Marketing", "Mailchimp", "HubSpot", "ActiveCampaign", 
        "Marketing Automation", "Lead Generation", "Lead Nurturing", "Conversion Rate Optimization (CRO)", 
        "Web Analytics", "Google Analytics 4 (GA4)", "Google Tag Manager (GTM)", "Hotjar", 
        "A/B Testing", "Affiliate Marketing", "Influencer Marketing", "Growth Hacking", 
        "Customer Acquisition", "Customer Lifetime Value (LTV) Optimization", "Customer Acquisition Cost (CAC)", 
        "Marketing Strategy", "Campaign Planning", "Performance Marketing", "Content Marketing", 
        "Multi-channel Marketing", "Digital Advertising", "Marketing Funnels", "UTM Tracking", 
        "Competitor Analysis", "ROI Analysis"
    ],
    seo: [
        "On-Page SEO", "Off-Page SEO", "Technical SEO", "Keyword Research", "Competitor Analysis (SEO)", 
        "Local SEO", "E-commerce SEO", "Search Engine Algorithms", "Google Search Console", 
        "Google Analytics", "Semrush", "Ahrefs", "Moz", "Screaming Frog", "SEO Auditing", 
        "Link Building", "Backlink Analysis", "Content Optimization", "Schema Markup", 
        "Structured Data", "XML Sitemaps", "Robots.txt Optimization", "Site Speed Optimization", 
        "Core Web Vitals", "Mobile SEO", "Rank Tracking", "Serpstat", "Answer the Public", 
        "Keyword Clustering", "Voice Search Optimization", "International SEO", "Multilingual SEO", 
        "Site Architecture Optimization", "Canonicalization", "Redirects Management", 
        "Duplicate Content Resolution", "SEO Writing", "Anchor Text Optimization", 
        "Google Business Profile"
    ],
    socialMediaMarketing: [
        "Social Media Strategy", "Community Management", "Content Calendar Planning", 
        "Facebook Marketing", "Instagram Marketing", "LinkedIn Marketing", "Twitter Marketing", 
        "Pinterest Marketing", "YouTube Marketing", "TikTok Marketing", "Social Media Advertising", 
        "Social Media Analytics", "Hootsuite", "Buffer", "Sprout Social", "Later", "Brand Awareness", 
        "Engagement Rate Optimization", "Viral Marketing", "Social Listening", "Brand Reputation Management", 
        "Hashtag Strategy", "Social Media Content Creation", "Influencer Collaboration", 
        "UGC Strategy", "Social Media Audits", "Social Media Moderation", "Social Commerce", 
        "Live Streaming Strategy", "Video Content Strategy", "Crisis Communication (Social)"
    ],
    contentWriting: [
        "Blog Writing", "Article Writing", "Website Content", "Ghostwriting", "Long-form Content", 
        "Technical Writing", "Creative Writing", "Essay Writing", "Editing & Proofreading", 
        "Researching", "SEO Content Writing", "Keyword Optimization (Content)", "Content Strategy", 
        "Storytelling", "eBook Writing", "Whitepaper Writing", "Case Study Writing", "Newsletter Writing", 
        "Scriptwriting", "Press Release Writing", "Tone of Voice Consistency", "Plagiarism Checking", 
        "Grammarly", "Hemingway Editor", "Topic Brainstorming", "Interviewing for Content", 
        "Content Curation", "Rewriting", "Summarizing", "Content Localisation", "Academic Writing"
    ],
    copywriting: [
        "Sales Copywriting", "Ad Copywriting", "Email Copywriting", "Landing Page Copywriting", 
        "Website Copy", "Direct Response Copywriting", "Sales Letters", "Headline Writing", 
        "Call to Action (CTA) Optimization", "Persuasive Writing", "Brand Voice Development", 
        "Slogan Writing", "Tagline Writing", "Social Media Copy", "Product Description Writing", 
        "Video Script Copywriting", "Print Ad Copy", "Billboard Copy", "Brochure Copy", 
        "Competitor Copy Analysis", "Conversion-Focused Copywriting", "Empathy-Based Copywriting", 
        "Storytelling in Copy", "Pitch Decks", "Copy Editing", "Proofreading Sales Copy"
    ],
    publicRelations: [
        "Media Relations", "Press Release Writing", "Press Release Distribution", "Crisis Communication", 
        "Crisis Management", "Brand Reputation Management", "Public Relations Strategy", "Media Pitching", 
        "Event PR", "Press Conference Organization", "Media Kit Development", "Public Speaking", 
        "Executive Communications", "Internal Communications", "Stakeholder Relations", 
        "Corporate Social Responsibility (CSR)", "Publicity Campaigns", "Media Monitoring", 
        "Muck Rack", "Cision", "PRWeb", "Community Relations", "Influencer PR", "Media Training"
    ],

    sales: [
        "Cold Calling", "Cold Emailing", "Lead Generation", "Sales Pitching", "Product Demonstration", 
        "Negotiation", "Objection Handling", "Sales Closing", "Consultative Sales", "B2B Sales", 
        "B2C Sales", "Enterprise Sales", "Inside Sales", "Outside Sales", "Sales Funnel Management", 
        "CRM", "Salesforce", "HubSpot CRM", "Zoho CRM", "Pipeline Management", "Sales Forecasting", 
        "Sales Quota Attainment", "Key Account Sales", "Relationship Selling", "Upselling", 
        "Cross-selling", "Referral Sales", "Social Selling", "LinkedIn Sales Navigator", 
        "Sales Outreach", "Contract Negotiation (Sales)", "Retail Sales", "Sales Presentations"
    ],
    businessDevelopment: [
        "Strategic Partnerships", "Lead Generation (BD)", "Market Research", "Competitor Analysis (BD)", 
        "Strategic Planning", "Business Pitching", "Relationship Management", "Client Acquisition", 
        "Market Expansion", "Revenue Generation", "Corporate Strategy", "Networking", 
        "Deal Structuring", "Contract Negotiation (BD)", "Joint Ventures", "Sales Funnel Integration", 
        "Growth Strategy", "Proposal Writing (RFP)", "Feasibility Studies", "Client Relationship Development", 
        "Business Model Innovation", "Cross-functional Collaboration", "Strategic Alliance", 
        "Key Account Management", "Sales Pipeline Acceleration", "Outbound Outreach"
    ],
    customerSupport: [
        "Customer Service", "Customer Support", "Help Desk Support", "Technical Support", 
        "Troubleshooting", "Call Center Operations", "Live Chat Support", "Email Support", 
        "Phone Support", "Ticket Management", "Zendesk", "Freshdesk", "Intercom", 
        "Jira Service Management", "CSAT Optimization", "NPS", "Escalation Management", 
        "Conflict Resolution", "Empathy in Communication", "Active Listening", "Customer Retention", 
        "Refund & Dispute Resolution", "Billing Support", "Account Troubleshooting", 
        "Knowledge Base Writing", "Customer Onboarding", "SLA Compliance", "CRM Utilization"
    ],
    accountManagement: [
        "Client Relationship Management", "Key Account Management (AM)", "Customer Success", 
        "Client Retention", "Client Onboarding (AM)", "Upselling (AM)", "Cross-selling (AM)", 
        "Account Growth", "Revenue Retention", "Client Retention Strategy", "Customer Satisfaction (CSAT)", 
        "Business Reviews (QBR/ABR)", "Client Advocacy", "Project Liaison", "Client Communication", 
        "Contract Renewal", "Account Health Monitoring", "Strategic Account Planning", 
        "Churn Reduction", "Portfolio Management", "Stakeholder Management (AM)", "Service Delivery"
    ],
    projectManagement: [
        "Project Planning", "Project Scheduling", "Agile Methodologies", "Scrum Framework", 
        "Kanban Framework", "Waterfall Methodology", "Project Budgeting", "Resource Allocation", 
        "Risk Management", "Stakeholder Management", "Scope Management", "Quality Management", 
        "Project Tracking", "Milestone Tracking", "Jira", "Trello", "Asana", "Monday.com", 
        "MS Project", "Basecamp", "Confluence", "Gantt Charts", "Status Reporting", 
        "Cross-functional Leadership", "Conflict Resolution (PM)", "Change Management", 
        "Agile Coaching", "Scrum Master", "Product Owner Liaison", "Project Auditing"
    ],
    productManagement: [
        "Product Strategy", "Product Roadmap", "Product Lifecycle Management (PLM)", 
        "Agile Product Management", "User Story Writing", "Product Backlog Prioritization", 
        "Epic Creation", "Market Research (Product)", "Competitor Analysis (Product)", 
        "Customer Discovery", "PRD Writing", "Feature Specification", "User Story Mapping", 
        "A/B Testing (Product)", "User Analytics", "Amplitude", "Mixpanel", "Google Analytics (Product)", 
        "Product Launch (Go-To-Market)", "Cross-functional Leadership (PM)", "Stakeholder Alignment", 
        "Wireframing (Product)", "MVP Definition", "Customer Feedback Loops", 
        "Product Design Liaison", "Technical Product Management", "OKR Planning", "KPI Tracking"
    ],

    finance: [
        "Financial Analysis", "Financial Modeling", "FP&A", "Corporate Finance", 
        "Valuation", "Capital Budgeting", "Risk Management (Finance)", "Portfolio Management", 
        "Cash Flow Management", "Cash Flow Forecasting", "Working Capital Management", 
        "Mergers & Acquisitions (M&A)", "Due Diligence", "Financial Reporting", 
        "Financial Statements Analysis", "Treasury Management", "Debt Management", 
        "Capital Raising", "Equity Research", "Quantitative Finance", "Asset Valuation", 
        "Cost Analysis", "Profitability Analysis", "Financial Auditing", "Strategic Finance", 
        "Advanced Excel", "VBA", "Financial Systems (SAP, Oracle)", "Variance Analysis"
    ],
    accounting: [
        "Financial Accounting", "Managerial Accounting", "General Ledger", "Accounts Payable (AP)", 
        "Accounts Receivable (AR)", "Bank Reconciliation", "Journal Entries", "Month-End Close", 
        "Year-End Close", "Fixed Asset Accounting", "Payroll Accounting", "Financial Reporting (Accounting)", 
        "GAAP Compliance", "IFRS Compliance", "Chart of Accounts", "Trial Balance", 
        "Accounting Software", "QuickBooks", "Xero", "NetSuite", "SAP ERP", "Sage", 
        "Microsoft Dynamics", "Cost Accounting", "Inventory Accounting", "Intercompany Reconciliation"
    ],
    bookkeeping: [
        "QuickBooks (Bookkeeping)", "Xero (Bookkeeping)", "Double-Entry Bookkeeping", 
        "Accounts Payable (AP - Bookkeeping)", "Accounts Receivable (AR - Bookkeeping)", 
        "Bank Reconciliation (Bookkeeping)", "Credit Card Reconciliation", "Invoicing", 
        "Billing (Bookkeeping)", "Ledger Maintenance", "Financial Record Keeping", 
        "Payroll Processing", "Expense Tracking", "Data Entry (Accounting)", "Receipts Management", 
        "Petty Cash Management", "Sales Tax Filing", "1099 Processing", "P&L Statement Preparation"
    ],
    investmentAnalysis: [
        "Portfolio Management (IA)", "Equity Research (IA)", "Fixed Income Analysis", 
        "Quantitative Analysis (IA)", "Financial Modeling (IA)", "Valuation Models", 
        "Discounted Cash Flow (DCF)", "Comparable Company Analysis", "Precedent Transactions", 
        "Asset Allocation", "Risk-Adjusted Return", "Sharpe Ratio", "Technical Analysis", 
        "Fundamental Analysis", "Market Research (IA)", "Macroeconomic Analysis", 
        "Investment Strategy", "Alternative Investments", "Real Estate Investment Analysis", 
        "Private Equity", "Venture Capital", "Financial Derivatives", "Bloomberg Terminal"
    ],
    taxation: [
        "Tax Preparation", "Tax Planning", "Corporate Tax", "Individual Tax", 
        "Partnership Tax", "Sales Tax", "Value Added Tax (VAT)", "Income Tax", 
        "State and Local Tax (SALT)", "International Taxation", "IRS Tax Audits", 
        "IRS Representation", "Tax Compliance", "Tax Research", "Tax Laws & Regulations", 
        "Tax Deductions", "Tax Credits", "Transfer Pricing", "Estate and Gift Tax", 
        "Payroll Tax", "TurboTax", "ProSeries", "UltraTax CS", "Tax Provision"
    ],
    auditing: [
        "Internal Auditing", "External Auditing", "Financial Auditing", "Operational Auditing", 
        "Compliance Auditing", "Forensic Auditing", "Audit Planning", "Audit Risk Assessment", 
        "Audit Sampling", "Internal Controls Assessment", "SOX Compliance", "IT Auditing", 
        "COBIT Framework", "COSO Framework", "Audit Documentation", "Workpapers Preparation", 
        "Audit Reporting", "Findings & Recommendations", "Audit Testing", "Reconciliation Audits"
    ],

    legal: [
        "Corporate Law", "Contract Law", "Intellectual Property (IP) Law", "Patents", 
        "Trademarks", "Copyrights", "Employment Law", "Labor Law", "Real Estate Law", 
        "Litigation", "Legal Research", "Legal Writing", "Westlaw", "LexisNexis", 
        "Legal Drafts", "Brief Writing", "Court Filings", "Deposition Preparation", 
        "Legal Compliance", "Legal Counsel", "Litigation Support", "Family Law", 
        "Immigration Law", "Personal Injury Law", "Dispute Resolution", "Arbitration"
    ],
    compliance: [
        "Regulatory Compliance", "AML (Anti-Money Laundering)", "KYC (Know Your Customer)", 
        "Risk Assessment (Compliance)", "Compliance Auditing", "Compliance Program Development", 
        "Code of Conduct", "Policy Drafting", "HIPAA Compliance", "GDPR Compliance", 
        "SOX Compliance (Legal)", "SEC Regulations", "Financial Compliance", "Environmental Compliance", 
        "OSHA Compliance", "Healthcare Compliance", "Compliance Training", "Incident Investigation", 
        "Fraud Prevention", "Internal Controls Compliance", "Sanctions Screening", 
        "Transaction Monitoring"
    ],
    contractManagement: [
        "Contract Drafting", "Contract Review", "Contract Negotiation", "Contract Administration", 
        "Contract Lifecycle Management (CLM)", "Service Level Agreements (SLAs)", "NDAs", 
        "Master Services Agreements (MSAs)", "SOWs", "Vendor Contracts", "Lease Agreements", 
        "Contract Compliance", "Risk Assessment in Contracts", "Contract Amendments", 
        "Contract Renewals", "Contract Termination", "CLM Software", "DocuSign", "Ironclad"
    ],

    humanResources: [
        "Human Resource Management (HRM)", "Employee Relations", "HR Policies & Procedures", 
        "Employee Onboarding", "Employee Offboarding", "Performance Management", "Performance Reviews", 
        "Talent Management", "Employee Engagement", "Organizational Development", "HRIS", 
        "Workday", "BambooHR", "ADP", "Gusto", "Compensation & Benefits", "Payroll Management", 
        "Labor Law Compliance (HR)", "Conflict Resolution (HR)", "Workplace Investigations", 
        "Diversity, Equity & Inclusion (DEI)", "Employee Retention", "Succession Planning", "HR Strategy"
    ],
    recruitment: [
        "Sourcing Candidates", "Candidate Screening", "Interviewing", "Technical Recruiting", 
        "Executive Search", "High-Volume Recruiting", "IT Recruiting", "Healthcare Recruiting", 
        "Sales Recruiting", "Candidate Experience", "Job Postings", "Applicant Tracking Systems (ATS)", 
        "Greenhouse", "Lever", "Workable", "Taleo", "Recruitment Marketing", "Passive Candidate Sourcing", 
        "Boolean Search", "LinkedIn Recruiter", "Interview Coordination", "Reference Checks"
    ],
    talentAcquisition: [
        "Strategic Sourcing", "Talent Pipeline Building", "Employer Branding", 
        "Candidate Relationship Management (CRM)", "Workforce Planning", "University Relations", 
        "D&I Sourcing", "Recruitment Analytics", "Executive Recruitment (TA)", "Talent Mapping", 
        "Referral Programs", "Sourcing Channels Optimization", "Candidate Assessments", 
        "Behavioral Interviewing", "Recruitment Operations", "Vendor Management", 
        "Talent Acquisition Strategy", "Career Fair Coordination", "Talent Intelligence"
    ],
    trainingDevelopment: [
        "Instructional Design", "Curriculum Design (L&D)", "Corporate Training", 
        "Employee Development", "Leadership Development", "E-learning Development", 
        "Learning Management Systems (LMS)", "Moodle", "Canvas LMS", "Articulate Storyline", 
        "Adobe Captivate", "Training Program Evaluation", "Training Needs Analysis", 
        "Workshop Facilitation", "Coaching & Mentoring", "Soft Skills Training", 
        "ADDIE Model", "Kirkpatrick Evaluation Model", "Compliance Training Development"
    ],

    education: [
        "Classroom Management", "Lesson Planning", "Differentiated Instruction", 
        "Student Assessment", "Special Education", "Early Childhood Education", 
        "Elementary Education", "Secondary Education", "Higher Education", "Online Teaching", 
        "Remote Learning", "Educational Technology", "Zoom for Education", "Google Classroom", 
        "Canvas (Education)", "Blackboard", "Student Counseling", "Parent-Teacher Communication", 
        "Educational Leadership", "Test Preparation (SAT, ACT, GRE)", "ESL Instruction", 
        "STEM Education", "Literacy Development", "Mathematics Instruction", "Grading & Feedback"
    ],
    tutoring: [
        "Subject Matter Expertise", "One-on-One Instruction", "Homework Help", 
        "Test Preparation (Tutoring)", "Academic Coaching", "Remote Tutoring", "Zoom (Tutoring)", 
        "Skype (Tutoring)", "Google Meet (Tutoring)", "Adult Education", "Remedial Teaching", 
        "Study Skills Training", "Mathematics Tutoring", "Physics Tutoring", "Chemistry Tutoring", 
        "Biology Tutoring", "English Tutoring", "Reading Comprehension", "Writing Tutoring", 
        "SAT/ACT Prep (Tutoring)", "GRE/GMAT Prep (Tutoring)", "Exam Strategy", "Student Motivation"
    ],
    curriculumDevelopment: [
        "Curriculum Design", "Instructional Design (Curriculum)", "Lesson Plan Creation", 
        "Educational Program Design", "Learning Objectives Alignment", "Assessment Design", 
        "Educational Standards Mapping", "Common Core Standards", "Syllabus Writing", 
        "Learning Material Creation", "Textbook Writing", "Educational Content Development", 
        "E-learning Curriculum Design", "Course Outline Development", "Teacher Training Guides", 
        "Interactive Learning Activities", "ADDIE Model (Curriculum)", "Backward Design (UbD)"
    ],

    healthcare: [
        "Patient Care", "Vital Signs Monitoring", "Medical Records Management", 
        "Electronic Health Records (EHR)", "Epic Systems", "Cerner", "Patient Triaging", 
        "First Aid", "CPR", "BLS (Basic Life Support)", "ACLS (Advanced Cardiac Life Support)", 
        "Patient Assessment", "Infection Control", "Medication Administration", 
        "Phlebotomy", "Venipuncture", "Wound Care", "Clinical Skills", "Patient Education", 
        "Medical Terminology", "HIPAA Regulations", "Healthcare Safety", "Telehealth"
    ],
    nursing: [
        "Registered Nurse (RN)", "Critical Care Nursing (ICU)", "Emergency Room (ER) Nursing", 
        "Pediatric Nursing", "Geriatric Nursing", "Surgical Nursing (OR)", "Labor & Delivery Nursing", 
        "Psychiatric Nursing", "Home Health Nursing", "Nursing Assessment", "Nursing Care Plans", 
        "IV Therapy", "Catheterization", "Medication Administration (Nursing)", "Patient Monitoring", 
        "Direct Patient Care", "Telemetry", "Wound Management (Nursing)", "Patient Discharge Planning", 
        "Nursing Documentation", "Nurse Leadership", "Infection Prevention in Nursing", "LPN"
    ],
    pharmacy: [
        "Pharmacotherapy", "Medication Dispensing", "Prescription Verification", 
        "Patient Counseling (Pharmacy)", "Pharmacology", "Drug Interactions Analysis", 
        "Compounding (Pharmacy)", "Pharmacy Management Systems", "PioneerRx", "Rx30", 
        "Inventory Management (Pharmacy)", "Pharmaceutical Care", "Clinical Pharmacy", 
        "Retail Pharmacy Operations", "Hospital Pharmacy Operations", "Sterile Compounding (USP 797)", 
        "Non-sterile Compounding (USP 795)", "Drug Information Services", "Pharmaceutics"
    ],
    medicalCoding: [
        "ICD-10-CM Coding", "ICD-10-PCS Coding", "CPT Coding", "HCPCS Level II Coding", 
        "Medical Billing", "Medical Claims Processing", "Medical Billing Software", "Kareo", 
        "CollaborateMD", "AdvancedMD", "Clinical Documentation Improvement (CDI)", 
        "AAPC Certification (CPC)", "AHIMA Certification (CCS)", "Medical Auditing (Coding)", 
        "Claims Denials Resolution", "Revenue Cycle Management (RCM)", "Medicare/Medicaid Billing Rules"
    ],
    healthcareAdministration: [
        "Healthcare Management", "Health Information Management (HIM)", "EMR Administration", 
        "Medical Practice Management", "Hospital Administration", "Clinic Operations", 
        "Healthcare Budgeting", "Revenue Cycle Management (Admin)", "HIPAA Compliance Management", 
        "Healthcare Quality Improvement", "Patient Scheduling Systems", "Staff Scheduling (Healthcare)", 
        "Healthcare Facility Management", "Healthcare Procurement", "Medical Office Administration"
    ],

    engineeringMechanical: [
        "Computer-Aided Design (CAD)", "SolidWorks", "Autodesk Inventor", "AutoCAD (Mechanical)", 
        "Finite Element Analysis (FEA)", "ANSYS", "Thermodynamics", "Fluid Mechanics", 
        "Heat Transfer", "Machine Design", "Kinematics", "Dynamics", "Materials Science", 
        "Manufacturing Processes (Mechanical)", "CNC Programming", "Prototyping (Mechanical)", 
        "Stress Analysis", "GD&T", "HVAC Design", "Pneumatics", "Hydraulics", "Robotics Engineering"
    ],
    engineeringElectrical: [
        "Circuit Design", "Schematic Capture", "PCB Layout", "Altium Designer", "Eagle CAD", 
        "KiCad", "Microcontrollers", "Arduino", "Raspberry Pi", "Embedded Systems", 
        "Embedded C/C++", "Signal Processing", "Power Systems Engineering", "Electrical Control Systems", 
        "PLC Programming", "HMI Design", "MATLAB/Simulink", "Instrumentation & Measurement", 
        "Oscilloscope Operation", "Soldering", "Analog Circuit Design", "Digital Circuit Design", 
        "Electrical Power Distribution", "Power Electronics", "Renewable Energy Systems", "NEC"
    ],
    engineeringCivil: [
        "AutoCAD Civil 3D", "Structural Analysis", "SAP2000", "STAAD.Pro", "Geotechnical Engineering", 
        "Transportation Engineering", "Environmental Engineering (Civil)", "Hydrology & Water Resources", 
        "Concrete Design", "Steel Design", "Foundation Design", "Structural Dynamics", "Surveying", 
        "GPS Surveying", "GIS (ArcGIS)", "Land Development Design", "Highway Design", "Site Planning"
    ],
    engineeringChemical: [
        "Process Engineering", "Chemical Process Simulation", "Aspen Plus", "Aspen HYSYS", 
        "Thermodynamics (Chemical)", "Mass Transfer", "Heat Transfer (Chemical)", 
        "Fluid Dynamics (Chemical)", "Chemical Reaction Engineering", "Process Piping Design", 
        "Process Control & Instrumentation", "P&IDs", "Process Safety Management (PSM)", 
        "HAZOP Study", "Chemical Plant Design", "Unit Operations", "Material & Energy Balances"
    ],
    engineeringIndustrial: [
        "Lean Manufacturing", "Six Sigma (Green/Black Belt)", "Continuous Improvement", "Kaizen", 
        "5S Methodology", "Value Stream Mapping (VSM)", "Operations Research", "Facilities Layout Design", 
        "Work Measurement", "Time & Motion Studies", "Supply Chain Engineering", 
        "Root Cause Analysis (RCA)", "Statistical Process Control (SPC)", "Production Planning & Control", 
        "ERP Systems (SAP)", "Capacity Planning", "Inventory Optimization", "Ergonomics"
    ],

    architecture: [
        "Architectural Design", "3D Architectural Modeling", "Revit", "AutoCAD (Architecture)", 
        "SketchUp", "Rhino 3D", "ArchiCAD", "Lumion", "V-Ray for SketchUp/Revit", 
        "Building Information Modeling (BIM)", "Architectural Drafting", "Conceptual Design", 
        "Site Analysis", "Building Codes & Regulations", "Zoning Laws", "Construction Documents", 
        "Sustainable Architecture", "LEED Accreditation", "Architectural Rendering", "Space Planning"
    ],
    interiorDesign: [
        "Space Planning (Interior)", "Interior Architecture", "Color Coordination", 
        "Furniture Selection", "Lighting Design (Interior)", "Fabric & Textile Selection", 
        "Moodboarding (Interior)", "Material Specification", "SketchUp (Interior)", 
        "AutoCAD (Interior Design)", "Interior Styling", "Budget Management (Interior)", 
        "Vendor Relations (Interior)", "Kitchen & Bath Design", "Custom Cabinetry Design", 
        "Residential Interior Design", "Commercial Interior Design", "Visual Merchandising (Interior)"
    ],
    constructionManagement: [
        "Construction Project Management", "Project Scheduling (Construction)", "Primavera P6", 
        "MS Project (Construction)", "Construction Estimating", "Cost Control (Construction)", 
        "Subcontractor Management", "Site Supervision", "Construction Safety (OSHA)", "Bid Management", 
        "RFI Management", "Submittals Management", "Change Order Management", "Blueprint Reading", 
        "QA in Construction", "Procurement (Construction)", "Contract Administration (Construction)"
    ],

    manufacturing: [
        "Production Management", "Manufacturing Processes", "CNC Machine Operation", 
        "CNC Programming (Mfg)", "Assembly Line Operations", "Plastic Injection Molding", 
        "Metal Fabrication", "Welding (Manufacturing)", "QA in Manufacturing", "Machine Maintenance (TPM)", 
        "Preventive Maintenance (Mfg)", "Manufacturing Safety (OSHA)", "Lean Manufacturing (Mfg)", 
        "Inventory Control (Mfg)", "MRP Systems", "Six Sigma (Mfg)", "Automation in Manufacturing"
    ],
    supplyChain: [
        "Supply Chain Management (SCM)", "Logistics Planning", "Inventory Management (SCM)", 
        "Demand Forecasting", "MRP", "Enterprise Resource Planning (ERP - SCM)", "SAP SCM", 
        "Oracle Supply Chain", "Supply Chain Analytics", "Warehouse Operations (SCM)", 
        "S&OP (Sales and Operations Planning)", "Vendor Management (SCM)", "Supplier Relationship Management (SRM)", 
        "Procurement Strategy (SCM)", "Supply Chain Risk Management", "Reverse Logistics"
    ],
    logistics: [
        "Logistics Management", "Warehousing", "Distribution Management", "Inventory Control (Logistics)", 
        "Order Fulfillment", "Shipping & Receiving", "Fleet Management", "Route Optimization", 
        "Freight Forwarding", "3PL (Third-Party Logistics)", "Logistics Software", 
        "WMS (Warehouse Management Systems)", "SAP Logistics", "Oracle WMS", "TMS", "Load Planning"
    ],
    procurement: [
        "Strategic Sourcing", "Vendor Negotiation (Procurement)", "SRM (Procurement)", "Purchasing", 
        "Purchase Order (PO) Processing", "RFP Management", "RFQ Management", 
        "Contract Negotiation (Procurement)", "Supplier Evaluation", "Cost Reduction Analysis", 
        "Spend Analysis", "Category Management", "Global Sourcing", "Procurement Software (SAP, Ariba)"
    ],
    qualityControl: [
        "Quality Control Inspection", "Quality Assurance (QA - QC)", "Statistical Process Control (SPC - QC)", 
        "ISO 9001 Standards", "Root Cause Analysis (RCA - QC)", "FMEA", "CAPA", "Non-Conformance Reporting (NCR)", 
        "Precision Measurement", "Calipers & Micrometers", "CMM Coordinate Measuring Machine", 
        "Destructive Testing", "Non-Destructive Testing (NDT)", "Quality Auditing (QC)"
    ],

    agriculture: [
        "Crop Cultivation", "Soil Science", "Agronomy", "Horticulture", "Irrigation Systems Management", 
        "Pest Control (Agriculture)", "Weed Management", "Soil Fertility Management", 
        "Greenhouse Management", "Hydroponics", "Organic Farming", "Sustainable Agriculture", 
        "Crop Rotation", "Farm Machinery Maintenance", "Livestock Management", "Animal Husbandry", 
        "Aquaculture", "Forestry Management", "Farm Business Management", "AgTech"
    ],
    foodProduction: [
        "Food Processing", "Food Safety Management", "HACCP Compliance", "Food Hygiene", 
        "Culinary Arts", "Baking & Pastry", "Food Packaging", "QA in Food Production", 
        "GMP (Good Manufacturing Practices)", "Recipe Scaling", "Food Preparation", 
        "Food Preservation (Canning, Freezing)", "Food Labeling Regulations", "FDA Compliance", 
        "Product Development (Food)", "Sanitation Procedures (SSOP)", "Menu Planning"
    ],
    environmentalScience: [
        "Environmental Impact Assessment (EIA)", "GIS (ArcGIS - Environmental)", "Environmental Compliance", 
        "Soil Sampling", "Water Sampling", "Air Quality Monitoring", "Waste Management", 
        "Recycling Systems", "Hazardous Waste Management", "Environmental Policy Analysis", 
        "Sustainability Consulting", "Ecology Research", "Biodiversity Conservation", 
        "Renewable Energy Systems", "Carbon Footprint Analysis", "Climate Change Mitigation"
    ],

    hospitality: [
        "Front Desk Operations", "Guest Relations", "Hotel Management", "Hospitality Operations", 
        "Customer Service (Hospitality)", "Property Management Systems (PMS)", "Opera PMS", 
        "Reservation Systems", "Concierge Services", "Housekeeping Management", "Night Audit Operations", 
        "VIP Guest Services", "Tourism Hospitality", "Event Services (Hospitality)"
    ],
    tourism: [
        "Travel Planning", "Tour Guiding", "Travel Consultation", "Travel Booking Systems", 
        "Sabre", "Amadeus", "Galileo", "Tour Package Creation", "Destination Marketing", 
        "Tourism Management", "Sustainable Tourism", "Eco-tourism", "Tour Operations", 
        "Itinerary Planning", "Customer Relations (Tourism)", "Travel Agency Operations"
    ],
    eventManagement: [
        "Event Planning", "Event Coordination", "Event Budgeting", "Venue Sourcing", 
        "Vendor Sourcing & Negotiation (Events)", "Event Marketing", "On-site Event Management", 
        "Event Registration Systems", "AV Coordination", "Catering Coordination", 
        "Corporate Event Planning", "Wedding Planning", "Conference Management", "Exhibition Planning"
    ],

    retail: [
        "Point of Sale (POS) Systems", "Cashier Operations", "Customer Service (Retail)", 
        "Retail Sales", "Visual Merchandising (Retail)", "Store Operations", "Inventory Management (Retail)", 
        "Cash Handling", "Upselling in Retail", "Product Knowledge", "Loss Prevention", 
        "Customer Query Resolution", "Retail Marketing", "Returns & Exchanges Processing"
    ],
    ecommerce: [
        "E-commerce Management", "Shopify", "WooCommerce", "Magento", "BigCommerce", 
        "Amazon Seller Central", "eBay Store Management", "Product Listing Optimization", 
        "E-commerce SEO", "Conversion Rate Optimization (CRO - Ecommerce)", "Stripe", 
        "PayPal Integration", "Order Fulfillment Management", "Dropshipping", 
        "E-commerce Marketing", "Google Shopping Ads", "Inventory Management (E-commerce)"
    ],
    merchandising: [
        "Visual Merchandising (Merch)", "Retail Merchandising", "Product Placement", 
        "Inventory Replenishment (Merch)", "Stock Rotation", "Planogram Implementation", 
        "Window Display Design", "Mannequin Styling", "Merchandising Analytics", 
        "Category Merchandising", "Pricing Strategy (Merch)", "Promotional Merchandising", 
        "Buying (Retail)", "Trend Analysis (Merch)"
    ],

    realEstate: [
        "Real Estate Sales", "Property Listing", "Real Estate Marketing", "Real Estate Negotiation", 
        "CRM (Real Estate)", "Comparative Market Analysis (CMA)", "Contract Preparation (Real Estate)", 
        "Open House Hosting", "Real Estate Investment Analysis (RE)", "Buyer Representation", 
        "Seller Representation", "Commercial Real Estate", "Residential Real Estate", 
        "Property Valuation (RE)", "MLS (Multiple Listing Service)"
    ],
    propertyManagement: [
        "Property Maintenance Management", "Tenant Relations", "Lease Administration", 
        "Rent Collection", "Property Inspection", "Property Management Software", 
        "AppFolio", "Yardi", "Buildium", "Tenant Screening", "Vendor Management (Property)", 
        "Budgeting (Property Management)", "Facility Management (Property)", "Lease Renewals"
    ],

    mediaJournalism: [
        "Journalism", "News Writing", "Editorial Writing", "Feature Writing", 
        "Investigative Journalism", "Copyediting (Journalism)", "Proofreading (Journalism)", 
        "AP Style Guide", "Interviewing Techniques (Journalism)", "Sourcing News", 
        "Fact-Checking", "Photojournalism (Media)", "Video Journalism", "Multimedia Storytelling", 
        "WordPress (Media)", "Breaking News Reporting", "Media Ethics", "News Editing"
    ],
    broadcasting: [
        "Broadcast Engineering", "Radio Broadcasting", "Television Broadcasting", 
        "Audio Engineering (Broadcast)", "Video Production (Broadcast)", "Broadcast Console Operation", 
        "Live Streaming (Broadcast)", "OBS Studio", "vMix", "Tricaster Operation", 
        "Camera Operation (Studio)", "Lighting Design (Studio - Broadcast)", "Sound Engineering (Broadcast)", 
        "On-Air Hosting", "Radio DJing", "Broadcast Editing", "Master Control Room Operations"
    ],
    podcasting: [
        "Podcast Production", "Podcast Hosting", "Podcast Recording", "Audio Editing (Podcast)", 
        "Audacity", "Adobe Audition", "Descript", "Sound Design (Podcast)", "Podcast Interviewing", 
        "Podcast Scriptwriting", "Show Notes Writing", "Podcast Marketing", "Podcast Distribution", 
        "RSS Feed Management", "Anchor (Spotify for Podcasters)", "Libsyn", "Podbean", 
        "Podcast Monetization", "Microphone Setup", "Acoustic Treatment", "Voice Training"
    ],

    translation: [
        "English Translation", "Spanish Translation", "French Translation", "German Translation", 
        "Chinese Translation", "Japanese Translation", "Arabic Translation", "Russian Translation", 
        "Portuguese Translation", "Italian Translation", "Localization", "CAT Tools", 
        "SDL Trados Studio", "MemoQ", "Wordfast", "Proofreading Translations", 
        "MTPE (Machine Translation Post-Editing)", "Technical Translation", "Medical Translation", 
        "Legal Translation", "Business Translation", "Subtitling (Translation)"
    ],
    transcription: [
        "Audio Transcription", "Video Transcription", "Medical Transcription", 
        "Legal Transcription", "General Transcription", "Audio to Text Typing", 
        "Speed Typing (Touch Typing)", "High WPM Typing", "Transcription Software", 
        "Express Scribe", "FTW Transcriber", "Time-stamping", "Verbatim Transcription", 
        "Clean Verbatim Transcription", "Speaker Identification", "Audio Enhancement", 
        "Foot Pedal Operation", "Transcription Proofreading"
    ],
    interpretation: [
        "Simultaneous Interpretation", "Consecutive Interpretation", "Whispered Interpretation", 
        "Liaison Interpretation", "OPI (Over-the-Phone Interpretation)", "VRI (Video Remote Interpretation)", 
        "Conference Interpretation", "Medical Interpretation", "Legal/Court Interpretation", 
        "Community Interpretation", "Cultural Brokerage", "Active Listening (Interpretation)", 
        "Note-Taking for Interpretation", "Bi-lingual Fluency", "Cross-cultural Communication"
    ],

    research: [
        "Quantitative Research", "Qualitative Research", "Literature Review", 
        "Market Research (Research)", "Academic Research", "Scientific Research", 
        "Data Collection", "Survey Design", "Focus Group Facilitation", "User Research (Research)", 
        "Research Proposal Writing", "Research Methodology", "Grant Writing", 
        "Scientific Writing", "Reference Management", "Zotero", "Mendeley", "EndNote", 
        "Data Analysis (Research)", "Content Analysis", "Hypothesis Testing (Research)"
    ],
    statistics: [
        "Statistical Analysis", "R Programming", "SAS", "SPSS", "Stata", "Hypothesis Testing (Stats)", 
        "Regression Analysis (Stats)", "ANOVA", "Probability Theory", "Statistical Modeling", 
        "Descriptive Statistics", "Inferential Statistics", "Correlation Analysis", 
        "Sampling Methodologies", "Quantitative Analysis (Stats)", "Biostatistics", 
        "Econometrics", "Mathematical Statistics", "Statistical Quality Control", "Factor Analysis"
    ],
    businessAnalysis: [
        "Business Analysis", "Requirements Gathering", "Business Process Modeling", 
        "BPMN", "UML (Business Analysis)", "Gap Analysis", "SWOT Analysis", "Feasibility Studies", 
        "BRD Writing", "FSD Writing", "Agile Business Analysis", "User Story Writing (BA)", 
        "Process Process Mapping", "Microsoft Visio", "Jira (BA)", "Confluence (BA)", 
        "Stakeholder Analysis", "SQL (Business Analysis)", "Business Intelligence", 
        "Tableau (BA)", "Power BI (BA)", "Change Management"
    ],

    administration: [
        "Office Administration", "Executive Assistance", "Calendar Management", 
        "Email Management", "Document Filing", "Office Logistics", "Office Supplies Inventory", 
        "Meeting Minutes Writing", "Meeting Scheduling", "Travel Coordination", 
        "Expense Report Preparation", "Reception Desk Operations", "Phone Etiquette", 
        "Data Entry (Admin)", "Customer Service (Admin)", "Invoicing (Admin)", 
        "Microsoft Word", "Microsoft Excel (Admin)", "Microsoft PowerPoint", 
        "Google Workspace", "Document Formatting", "Confidentiality Management"
    ],
    virtualAssistance: [
        "Calendar Management (VA)", "Email Management (VA)", "Customer Support (VA)", 
        "Social Media Scheduling (VA)", "Buffer (VA)", "Hootsuite (VA)", "Canva (VA)", 
        "Data Entry (VA)", "Internet Research (VA)", "Lead Generation (VA)", "Bookkeeping (VA)", 
        "QuickBooks (VA)", "Invoicing (VA)", "Travel Booking (VA)", "Google Workspace (VA)", 
        "Trello (VA)", "Asana (VA)", "Slack", "Zoom (VA)", "File Management (VA)", 
        "Google Forms", "Typeform"
    ],
    dataEntry: [
        "Speed Typing", "High Accuracy Typing", "Numeric Data Entry", "Ten-Key Data Entry", 
        "Copy-Paste Tasks", "Data Cleaning (Data Entry)", "Data De-duplication", 
        "Google Sheets", "Microsoft Excel (Data Entry)", "Data Validation", 
        "Web Research for Data Entry", "Database Entry", "Salesforce Data Entry", 
        "CRM Updates (Data Entry)", "Inventory Data Entry", "PDF to Excel Conversion", 
        "Online Data Entry", "Form Processing"
    ],

    automotive: [
        "Automotive Diagnostics", "Engine Repair", "Brake System Repair", "Transmission Repair", 
        "Suspension & Steering Repair", "Electrical System Diagnostics (Automotive)", 
        "OBD-II Scanner Operation", "Wheel Alignment", "HVAC Repair (Automotive)", 
        "Auto Body Repair", "Car Detailing", "Paint Spraying (Auto)", "Oil Change & Service", 
        "Tire Mounting & Balancing", "Diesel Engine Repair", "Hybrid & EV Service", 
        "Auto Parts Sourcing", "Automotive Wiring"
    ],
    aviation: [
        "Flight Planning", "Aircraft Piloting", "Commercial Aviation", "General Aviation", 
        "Air Traffic Control (ATC)", "Aviation Safety Management", "Aircraft Maintenance", 
        "Avionics Troubleshooting", "Aircraft Inspection", "Airframe Repair", "Powerplant Repair", 
        "Aviation Meteorology", "Flight Navigation", "Aviation Regulations (FAA/EASA)", 
        "Flight Simulator Operation", "Ground School Instruction", "Cabin Crew Procedures"
    ],
    marine: [
        "Marine Engineering", "Vessel Piloting", "Yacht Navigation", "Celestial Navigation", 
        "Marine Propulsion Systems", "Outboard Motor Repair", "Inboard Motor Repair", 
        "Boat Building", "Fiberglass Repair", "Marine Electrical Systems", "Marine Electronics", 
        "GPS Navigation Systems", "Chart Plotting", "Marine Safety Standards", 
        "Coast Guard Regulations", "Underwater Welding", "Diving Operations"
    ],

    fitness: [
        "Personal Training", "Group Fitness Instruction", "Strength and Conditioning", 
        "Cardio Training", "Weight Loss Coaching", "Muscle Building", "Yoga Instruction", 
        "Pilates Instruction", "Spin Class Instruction", "HIIT", "Flexibility Training", 
        "Fitness Assessment", "Body Composition Analysis", "Nutritional Advice (Fitness)", 
        "Fitness Program Design", "Workout Motivation", "First Aid & CPR (Fitness)"
    ],
    sportsCoaching: [
        "Sports Coaching", "Athletic Training", "Tactical Planning (Sports)", "Player Scouting", 
        "Game Analysis", "Sports Psychology", "Sports Injury Prevention", "Sports Rehabilitation", 
        "Youth Sports Coaching", "Team Building (Sports)", "Drills Design", "Sports Nutrition"
    ],
    wellness: [
        "Wellness Coaching", "Stress Management", "Mindfulness Facilitation", 
        "Meditation Instruction", "Holistic Health", "Nutritional Counseling", "Meal Planning", 
        "Herbalism", "Aromatherapy", "Massage Therapy", "Swedish Massage", "Deep Tissue Massage", 
        "Reflexology", "Lifestyle Coaching", "Sleep Optimization", "Wellness Retreat Facilitation"
    ],

    skilledTrades: [
        "Blueprint Reading (Trades)", "Hand Tools Safety", "Power Tools Safety", 
        "Workshop Management", "OSHA Safety Standards (Trades)", "Preventive Maintenance (Trades)", 
        "Measuring Instruments", "Heavy Machinery Operation", "Forklift Operation", 
        "Scaffolding Erection", "Rigging & Hoisting", "Material Handling", "Work Order Interpretation"
    ],
    electrician: [
        "Electrical Wiring", "Circuit Breaker Panel Installation", "Electrical Outlet Installation", 
        "Light Fixture Installation", "Electrical Troubleshooting", "Conduit Bending", 
        "NEC Compliance", "Low Voltage Wiring", "High Voltage Wiring", "Smart Home Installation", 
        "Generator Maintenance", "Industrial Electrical Systems", "Commercial Electrical Systems", 
        "Residential Electrical Systems", "Electrical Testing Equipment", "Multimeter Operation"
    ],
    plumbing: [
        "Pipe Fitting", "Copper Pipe Soldering", "PVC Pipe Assembly", "Drain Cleaning", 
        "Clog Clearance", "Water Heater Repair", "Toilet Installation & Repair", 
        "Faucet Installation", "Leak Detection", "Pipe Repair", "Sump Pump Maintenance", 
        "Commercial Plumbing", "Residential Plumbing", "Water Pressure Troubleshooting", 
        "Gas Piping Installation", "Reading Plumbing Schematics"
    ],
    carpentry: [
        "Woodworking", "Framing (Carpentry)", "Drywall Installation", "Cabinet Making", 
        "Trim Carpentry", "Crown Molding Installation", "Door & Window Installation", 
        "Deck Building", "Roofing Carpentry", "Wood Sanding & Finishing", "Carpentry Joinery", 
        "Furniture Building", "Blueprint Reading (Carpentry)", "Wood Carving", "Staircase Construction"
    ],
    welding: [
        "MIG Welding (GMAW)", "TIG Welding (GTAW)", "Stick Welding (SMAW)", 
        "Flux-Cored Arc Welding (FCAW)", "Oxy-Fuel Cutting", "Plasma Arc Cutting", 
        "Welding Blueprints Reading", "Metal Fabrication (Welding)", "Joint Preparation", 
        "Weld Inspection", "Welding Safety (PPE)", "Arc Welding", "Gas Welding", 
        "Structural Welding", "Pipe Welding", "Aluminum Welding", "Stainless Steel Welding"
    ],

    softSkills: [
        "Active Listening", "Empathy", "Adaptability", "Time Management", "Organization", 
        "Emotional Intelligence", "Critical Thinking", "Interpersonal Skills", "Cultural Sensitivity", 
        "Stress Tolerance", "Work Ethic", "Reliability", "Self-Motivation", "Curiosity", 
        "Lifelong Learning", "Conflict De-escalation", "Receptiveness to Feedback", 
        "Multi-tasking", "Patience", "Positive Attitude", "Professionalism", "Growth Mindset"
    ],
    leadership: [
        "Team Management", "Strategic Vision", "Decision Making", "Goal Setting", 
        "OKRs Management", "Employee Mentoring", "Executive Coaching", "Delegation", 
        "Performance Evaluation", "Conflict Resolution (Leadership)", "Change Management (Leadership)", 
        "Public Speaking (Leadership)", "Inspiration & Motivation", "Project Ownership", 
        "Accountability", "Crisis Leadership", "Cross-functional Management", "Meeting Facilitation"
    ],
    communication: [
        "Verbal Communication", "Written Communication", "Presentation Skills", "Public Speaking", 
        "Active Listening (Communication)", "Persuasion", "Storytelling", "Negotiation (Communication)", 
        "Email Etiquette", "Technical Writing (Communication)", "Interpersonal Communication", 
        "Nonverbal Communication", "Media Relations (Communication)", "Intercultural Communication", 
        "Editing", "Assertiveness", "Conflict Resolution (Communication)", "Business Writing"
    ],
    negotiation: [
        "Win-Win Negotiation", "Contract Negotiation (Negotiation)", "Salary Negotiation", 
        "Vendor Negotiation", "Sales Negotiation", "Conflict Resolution (Negotiation)", 
        "Persuasion Tactics", "Objection Handling (Negotiation)", "Mediation", 
        "Settlement Negotiation", "Business Deal Structuring", "Strategic Compromise", 
        "Buyer-Seller Liaison", "Crisis Negotiation", "Value Creation", "Price Negotiation"
    ],
    problemSolving: [
        "Root Cause Analysis", "Brainstorming", "Creative Thinking", "Analytical Thinking", 
        "Troubleshooting", "Decision Making (Problem Solving)", "Diagnostic Skills", 
        "Risk Assessment (Problem Solving)", "Critical Thinking (Problem Solving)", 
        "Lateral Thinking", "Conflict Resolution (Problem Solving)", "Troubleshooting Technical Issues", 
        "Systemic Thinking", "Researching Solutions", "Logic and Reasoning", "Debugging (Problem Solving)"
    ]
};

module.exports = { skills };