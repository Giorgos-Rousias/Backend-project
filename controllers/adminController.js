const db = require("../models");
const { faker } = require('@faker-js/faker');
const bcrypt = require("bcryptjs");


/*
dummyDataGenerator(req, res)
Η λειτουργία dummyDataGenerator δημιουργεί ψευδοδεδομένα για δοκιμές. Δημιουργεί νέους χρήστες, φίλους, δημοσιεύσεις, likes, σχόλια, αγγελίες εργασίας, αιτήσεις, δεξιότητες, εκπαίδευση, και εμπειρία για να προσομοιώσει πραγματικές αλληλεπιδράσεις στην πλατφόρμα. Κάθε προφίλ χρήστη γεμίζεται με περιστασιακά ρεαλιστικά, τυχαία δεδομένα, ώστε η εφαρμογή να διαθέτει επαρκές περιεχόμενο για δοκιμές του συστήματος συστάσεων και άλλων λειτουργιών.
*/
exports.dummyDataGenerator = async (req, res) => {
	try {
		// Check if user is admin 
		if (!req.user.isAdmin) {
			return res.status(403).json({
				error: "Unauthorized access",
			});
		}


		const hashedPassword = await bcrypt.hash("1234", 10); 
		
		const newUsers = 40;
		for (let i = 0; i < newUsers; i++) {
			await db.User.create({
				firstName: faker.person.firstName(),
				lastName: faker.person.lastName(),
				email: faker.internet.email(),
				password: hashedPassword, // Ensure this is the resolved hashed password
				phoneNumber: '1234567890',
				photo: null,
				hasPhoto: false,
			});
		}

		const users = await db.User.findAll({
			where: {
				isAdmin: false
			},
		})

		async function processUsers(users) {
			for (const user of users) {
				
				function getRandomNumbersWithDuplicatesRemoved(count, min, max, excludeId) {
					const numbers = [];
					for (let i = 0; i < count; i++) {
						let randomNum;
						do {
							randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
						} while (randomNum === excludeId);
						numbers.push(randomNum);
					}
					return Array.from(new Set(numbers));
				}

				// Create Friends
				const createFriends = async (userId) => {
					try {
						let maxFriends = 9;
						let minFriends = 0;
						const randomNumFriends = Math.floor(Math.random() * (maxFriends - minFriends + 1)) + minFriends;
						const randomUsers = getRandomNumbersWithDuplicatesRemoved(randomNumFriends, 2, users.length, user.id);

						for (const id of randomUsers) {
							let isFriends = await db.UserFriends.findOne({
								where: {
									userId: id,
									friendId: userId
								}
							});
							if (isFriends !== null) continue;

							isFriends = await db.UserFriends.findOne({
								where: {
									userId: userId,
									friendId: id
								}
							});
							if (isFriends !== null) continue;

							await db.UserFriends.create({ userId, friendId: id, status: "accepted" });
							await db.UserFriends.create({ userId: id, friendId: userId, status: "accepted" });
						}
					} catch (error) {
						console.log("Error creating friends: ", error);
					}
				};

				// Create Posts
				const createPosts = async (userId) => {
					try {
						let maxPost = 4;
						let minPost = 0;
						const randomNumPosts = Math.floor(Math.random() * (maxPost - minPost + 1)) + minPost;
						const randomPosts = getRandomNumbersWithDuplicatesRemoved(randomNumPosts, 0, 10, -1);

						for (const id of randomPosts) {
							await db.Post.create({
								creatorUserId: userId,
								text: postTexts[id]
							});
						}
					} catch (error) {
						console.log("Error creating posts: ", error);
					}
				};

				// Create Likes
				const createLikes = async (userId) => {
					try {
						const posts = await db.User.findAll();
						let maxLikes = 10;
						let minLikes = 1;
						const randomNumLikes = Math.floor(Math.random() * (maxLikes - minLikes + 1)) + minLikes;
						const randomLikes = getRandomNumbersWithDuplicatesRemoved(randomNumLikes, 1, posts.length, -1);

						for (const id of randomLikes) {
							const post = await db.Post.findByPk(id);
							if (!post) continue;
							const isLiked = await db.Like.findOne({ where: { userId, postId: id } });
							if (isLiked !== null) continue;

							await db.Like.create({ userId, postId: id });
						}
					} catch (error) {
						console.log("Error creating likes: ", error);
					}
				};

				// Create Comments
				const createComments = async (userId) => {
					try {
						const posts = await db.User.findAll();
						let maxComments = 4;
						let minComments = 0;
						const randomNumComments = Math.floor(Math.random() * (maxComments - minComments + 1)) + minComments;
						const randomComments = getRandomNumbersWithDuplicatesRemoved(randomNumComments, 1, posts.length, -1);

						for (const id of randomComments) {
							const post = await db.Post.findByPk(id);
							if (!post) continue;
							await db.Comment.create({
								userId,
								postId: id,
								text: "No importance"
							});
						}
					} catch (error) {
						console.log("Error creating comments: ", error);
					}
				};

				// Create Job Listings
				const createJobListings = async (userId) => {
					try {
						let maxJobListings = 4;
						let minJobListings = 0;
						const randomNumJobListings = Math.floor(Math.random() * (maxJobListings - minJobListings + 1)) + minJobListings;

						for (let i = 0; i < randomNumJobListings; i++) {
							await db.Listing.create({
								userId,
								title: faker.person.jobTitle(),
								description: jobDescriptions[Math.floor(Math.random() * jobDescriptions.length)],
								location: faker.location.city(),
								company: faker.company.name(),
								salary: faker.finance.amount()
							});
						}
					} catch (error) {
						console.log("Error creating job listings: ", error);
					}
				};

				// Create Applications
				const createApplications = async (user) => {
                    try {
                        const jobListings = await db.Listing.findAll();
                        if (!jobListings || jobListings.length === 0) return;

                        const maxApplications = 4;
                        const minApplications = 0;
                        const randomNumApplications = Math.floor(Math.random() * (maxApplications - minApplications + 1)) + minApplications;
                        const appliedListings = new Set();

                        for (let i = 0; i < randomNumApplications; i++) {
                            const randomJobListing = jobListings[Math.floor(Math.random() * jobListings.length)];
                            
                            if (appliedListings.has(randomJobListing.id)){
                                continue;
                            }

                            appliedListings.add(randomJobListing.id);
                            await user.addAppliedToListing(randomJobListing);
                        }
                    } catch (error) {
                        console.log("Error creating applications: ", error);
                    }
                };

				// Create Skills
				const createSkills = async (userId) => {
					try {
						let maxSkills = 5;
						let minSkills = 0;
						const randomNumSkills = Math.floor(Math.random() * (maxSkills - minSkills + 1)) + minSkills;
						for (let i = 0; i < randomNumSkills; i++) {
							await db.Skill.create({
								userId,
								skill: skillsList[Math.floor(Math.random() * skillsList.length)],
								description: faker.lorem.sentence()
							});
						}
					} catch (error) {
						console.log("Error creating skills: ", error);
					}
				};

				// Create Education
				const createEducation = async (userId) => {
					try {
						let maxEducation = 4;
						let minEducation = 0;
						const randomNumEducation = Math.floor(Math.random() * (maxEducation - minEducation + 1)) + minEducation;
						for (let i = 0; i < randomNumEducation; i++) {
							await db.Education.create({
								userId,
								institution: faker.company.name(),
								degree: degreesList[Math.floor(Math.random() * degreesList.length)],
								startYear: faker.number.int({ min: 2000, max: 2020 }),
								endYear: 2020,
							});
						}
					} catch (error) {
						console.log("Error creating education: ", error);
					}
				};

				// Create Experience
				const createExperience = async (userId) => {
					try {
						let maxExperience = 4;
						let minExperience = 0;
						const randomNumExperience = Math.floor(Math.random() * (maxExperience - minExperience + 1)) + minExperience;

						for (let i = 0; i < randomNumExperience; i++) {
							await db.Experience.create({
								userId,
								company: faker.company.name(),
								role: faker.person.jobTitle(),
								startYear: faker.number.int({ min: 2000, max: 2020 }),
								endYear: 2020,
							});
						}
					} catch (error) {
						console.log("Error creating experience: ", error);
					}
				};

				const createSeeListings = async (user) => {
                    try {
                        let maxSeeListings = 4;
                        let minSeeListings = 2;
                        const randomNumSeeListings = Math.floor(Math.random() * (maxSeeListings - minSeeListings + 1)) + minSeeListings;

                        const numberOfListings = await db.Listing.count();

                        const randomListings = getRandomNumbersWithDuplicatesRemoved(randomNumSeeListings, 1, numberOfListings, -1);

                        for (const id of randomListings) {
                            const listing = await db.Listing.findByPk(id);
                            if (!listing) {
                                continue;
                            }

                            const alreadySeen = await user.hasSeen(listing);
                            if (alreadySeen) {
                                continue;
                            }

                            await user.addSeen(listing);
                        }
                    } catch (error) {
                        console.log("Error creating see listing: ", error);
                    }
                };

                // Now calling each async function for the user in sequence
                await createFriends(user.id);
                await createPosts(user.id);
                await createLikes(user.id);
                await createComments(user.id);
                await createJobListings(user.id);
                await createApplications(user);
                await createSkills(user.id);
                await createEducation(user.id);
                await createExperience(user.id);
                await createSeeListings(user);
			}
		}

		// Call the function with the users array
		await processUsers(users);

		res.status(200).json({
			message: "Dummy data created successfully",
		});
	} catch (error) {
		console.error("Error creating dummy data:", error);
		res.status(500).json({ error: error.message });
	}
};


const postTexts = [
	"Excited to connect with industry leaders and expand my professional network!",
	"Attending a virtual conference on software development—great opportunity to learn and network!",
	"Looking for collaborators on an exciting new app development project. Who's interested?",
	"Just published my latest blog post on the future of cloud computing. Let's discuss!",
	"Does anyone have experience with scaling agile teams? I'd love to connect and chat.",
	"Networking tip: Follow up with your connections after meeting at a conference or event!",
	"Hiring talented full-stack developers. Drop your CV or reach out directly!",
	"Looking forward to presenting at next week's tech meetup on microservices architecture.",
	"Taking the next step in my career by learning more about AI and machine learning.",
	"Looking for a mentor in product management. Any recommendations?",
	"How do you manage your work-life balance as a remote worker? Let's exchange tips!",
	"Happy to announce I've joined a new team as a senior backend developer!",
];

const skillsList = [
	"JavaScript",
	"Python",
	"Data analysis with Python and R",
	"Project management and agile methodologies",
	"Web development with HTML, CSS, and React",
	"Database management with SQL and NoSQL",
	"SQL",
	"Cloud computing with AWS and Azure",
	"Machine learning",
	"AI",
	"UI/UX designer",
	"DevOps and CI/CD pipeline setup",
	"Networking and cybersecurity basics",
	"Mobile application development",
	"junior developer",
	"SEO",
	"Business analysis",
	"Software testing and quality assurance",
	"API design and integration with RESTful services",
    "DevOps",
    "Jenkins",
    "GitLab CI",
    "Docker",
    "Node.js",
    "Kubernetes",
    "Flutter",
    "Agile",
    "SEO",
    "Testing",
    "Tableau",
    "Flask",
    "Java",
    "Leadership",
    "RPA",
    "Data Analysis",
    "Cybersecurity",
    "Prototyping",
    "REST APIs",
    "Scalability"
];

const jobDescriptions = [
    "Develop and maintain high-quality web applications using JavaScript, React, and modern frameworks. Collaborate with designers and back-end developers to create a seamless user experience, ensuring responsive design and cross-browser compatibility.",
    "Collaborate with cross-functional teams, including product owners, designers, and engineers, to gather requirements and deliver scalable software solutions. Participate in code reviews, ensure adherence to best practices, and mentor junior developers.",
    "Design and implement efficient data storage solutions using SQL and NoSQL databases. Optimize database performance, write complex queries, and ensure data integrity across multiple environments. Work closely with the engineering team to ensure robust and scalable solutions.",
    "Manage cloud infrastructure and deploy services using AWS or Azure. Automate infrastructure provisioning and maintenance tasks using Infrastructure as Code (IaC) tools like Terraform. Ensure high availability, scalability, and security of cloud-based applications.",
    "Create engaging UI/UX designs, conduct user testing, and iterate based on feedback to improve usability. Develop wireframes, prototypes, and visual designs using tools such as Figma or Sketch. Work closely with front-end developers to bring designs to life.",
    "Develop machine learning models to solve complex business problems, and integrate them into existing applications. Analyze large datasets to extract insights, create predictive models, and evaluate model performance. Collaborate with data engineers to deploy models in production environments.",
    "Lead project teams through agile processes to ensure on-time delivery of features. Facilitate daily stand-ups, sprint planning, and retrospective meetings. Identify risks and roadblocks, and develop strategies to mitigate them while ensuring stakeholder alignment.",
    "Write unit and integration tests to ensure the stability and quality of applications. Utilize tools such as Jest, Mocha, and Selenium to create automated test scripts. Collaborate with QA engineers to identify potential issues and verify fixes in the development process.",
    "Design and maintain CI/CD pipelines to streamline software delivery. Set up automated builds, tests, and deployments using Jenkins, GitLab CI, or similar tools. Work closely with development teams to implement continuous integration and deployment best practices.",
    "Provide technical support and training for internal and external stakeholders. Develop technical documentation, create user guides, and conduct workshops to ensure users are comfortable with software products. Work closely with the customer support team to address and resolve technical issues.",
    "Design and implement scalable microservices using Node.js or Java. Develop RESTful APIs, integrate third-party services, and ensure that the microservices architecture is highly available and fault-tolerant. Monitor system performance and make improvements where necessary.",
    "Drive digital transformation initiatives, focusing on automation, efficiency, and customer experience. Analyze business processes, identify bottlenecks, and recommend solutions to improve overall productivity. Work with multiple teams to successfully implement process improvements.",
    "Lead the design and development of a mobile application using frameworks such as Flutter or React Native. Implement user authentication, manage state effectively, and optimize the app for different devices and screen sizes. Ensure high performance and smooth animations.",
    "Develop comprehensive cybersecurity strategies to protect applications and data. Perform security assessments, vulnerability scans, and penetration testing. Educate development teams about secure coding practices, and establish protocols to respond to security incidents.",
    "Participate in the design, architecture, and development of large-scale distributed systems. Ensure that applications are built to handle significant growth and scalability requirements. Collaborate with infrastructure engineers to design robust, high-performance systems.",
    "Oversee end-to-end delivery of complex software projects, from initial concept to deployment. Prepare project plans, allocate resources, and manage timelines. Maintain regular communication with stakeholders, providing updates on project status, risks, and issues.",
    "Create digital marketing campaigns aimed at enhancing brand visibility and customer engagement. Utilize SEO, content marketing, and PPC to attract and retain customers. Analyze campaign performance metrics and optimize strategies for maximum effectiveness.",
    "Work closely with product managers to define and prioritize features. Create detailed user stories, acceptance criteria, and flow diagrams to capture requirements. Ensure that features align with business goals, and provide valuable feedback during feature development.",
    "Develop scalable backend services using Python and Flask, integrating with third-party APIs to extend the application's capabilities. Create automated scripts for data migration and transformation, ensuring that the system remains robust and efficient.",
    "Lead a team of junior developers, providing code reviews, mentorship, and technical guidance. Ensure the team adheres to coding standards, keeps up with modern development trends, and delivers high-quality software that meets business requirements.",
    "Coordinate with marketing and sales teams to strategize and execute product launches. Develop marketing collateral, participate in customer interviews, and perform competitive analysis to ensure successful market positioning.",
    "Manage software deployments and oversee the release process in a production environment. Collaborate with QA teams for final sign-offs and ensure rollback plans are in place. Handle production issues swiftly, ensuring minimum downtime.",
    "Conduct market research to identify customer needs and analyze competitor offerings. Provide insights to the product team to influence the product roadmap. Prepare reports on market trends and customer feedback.",
    "Implement automated workflows using robotic process automation (RPA) tools. Identify repetitive business tasks, design automation scripts, and work with business units to ensure smooth integration of automated processes.",
    "Analyze performance metrics to measure software efficiency. Utilize data visualization tools such as Power BI or Tableau to present metrics to stakeholders. Work with developers to optimize underperforming areas of the software.",
    "Perform server-side logic and manage databases to ensure efficient application performance. Handle integrations with third-party services, and optimize server usage for scalability.",
    "Create and manage product documentation, including user manuals and technical specifications. Work with developers to ensure that all product features are documented correctly, providing clear instructions for end users.",
    "Develop front-end code that meets WCAG accessibility standards to ensure web applications are accessible to all users, including those with disabilities. Collaborate with UX designers to implement visually appealing and compliant user interfaces."
];

const degreesList = [
    "Bachelor of Science in Computer Science",
    "Master of Science in Data Science",
    "Bachelor of Arts in Business Administration",
    "Master of Business Administration (MBA)",
    "Bachelor of Science in Information Technology",
    "Master of Science in Cybersecurity",
    "Bachelor of Science in Software Engineering",
    "Master of Science in Artificial Intelligence",
    "Bachelor of Science in Information Systems",
    "Associate Degree in Web Development",
    "Bachelor of Arts in Graphic Design",
    "Master of Arts in User Experience Design",
    "Bachelor of Science in Network Administration",
    "Doctor of Philosophy in Data Analytics",
    "Bachelor of Science in Mobile Application Development",
    "Master of Science in Cloud Computing",
    "Bachelor of Science in Game Development",
    "Bachelor of Science in Robotics",
    "Master of Science in DevOps Engineering",
    "Bachelor of Arts in Digital Marketing",
    "Master of Science in Business Intelligence",
    "Bachelor of Science in Environmental Science",
    "Bachelor of Arts in Communication Studies",
    "Master of Science in Software Quality Assurance",
    "Bachelor of Science in Computer Networking",
    "Associate Degree in Graphic Arts",
    "Master of Science in Human-Computer Interaction",
    "Bachelor of Science in Mathematics",
    "Bachelor of Science in Statistics",
    "Doctor of Philosophy in Machine Learning",
    "Master of Science in Big Data Technologies",
    "Bachelor of Science in Bioinformatics",
    "Bachelor of Arts in Multimedia Arts",
    "Master of Science in Ethical Hacking",
    "Bachelor of Science in Cloud Security",
    "Master of Science in Digital Forensics",
    "Bachelor of Science in Data Visualization",
    "Bachelor of Arts in Marketing Management",
    "Master of Science in Internet of Things (IoT)",
    "Bachelor of Science in Health Informatics",
    "Master of Science in Advanced Analytics",
    "Bachelor of Science in Artificial Intelligence Ethics",
    "Master of Science in Cloud Architecture"
];
