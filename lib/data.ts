import { type Course, type UserProfile, type CourseModule } from "./types"

/* ─── Module data per course ─── */

const logisticsModules: CourseModule[] = [
  {
    id: "l-m1",
    title: "Module 1: Introduction to Supply Chain Logistics",
    description: "Foundational concepts in logistics, supply chain networks, and the role of logistics in global commerce.",
    activities: [
      {
        id: "l-m1-a1",
        title: "Welcome & Course Overview",
        activityType: "video",
        completed: true,
        data: {
          type: "video",
          videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
          duration: "8:32",
          transcript: "Welcome to Supply Chain Logistics Fundamentals. In this course, we will explore the core principles that drive modern logistics operations...",
        },
      },
      {
        id: "l-m1-a2",
        title: "What is Supply Chain Management?",
        activityType: "reading",
        completed: true,
        data: {
          type: "reading",
          estimatedMinutes: 12,
          content: `## What is Supply Chain Management?\n\nSupply Chain Management (SCM) encompasses the planning and management of all activities involved in sourcing and procurement, conversion, and logistics management. Importantly, it also includes coordination and collaboration with channel partners, which can be suppliers, intermediaries, third-party service providers, and customers.\n\n### The Five Key Components\n\n**1. Planning**\nThis is the strategic portion of SCM. Companies need a strategy to manage all the resources that go toward meeting customer demand for their product or service.\n\n**2. Sourcing**\nChoose the suppliers that will deliver the goods and services you need to create your product. Develop a set of pricing, delivery, and payment processes with suppliers.\n\n**3. Manufacturing**\nThis is the step where companies are most focused on measuring quality levels, production output, and worker productivity.\n\n**4. Delivery & Logistics**\nThis part is often referred to as logistics. Coordinate the receipt of orders from customers, develop a network of warehouses, pick carriers to get products to customers, and set up an invoicing system to receive payments.\n\n**5. Returns**\nThis can be a problematic part of the supply chain for many companies. Create a network for receiving defective and excess products back from customers and supporting customers who have problems with delivered products.\n\n### Why SCM Matters\n\nEffective supply chain management reduces costs, waste, and time in the production cycle. The standard has become a just-in-time supply chain where retail sales automatically signal replenishment orders to manufacturers. Retail shelves can then be restocked almost as quickly as product is sold.\n\n> "The supply chain is the backbone of any business. Without it, you cannot deliver products to your customers." - Dr. Sarah Chen`,
        },
      },
      {
        id: "l-m1-a3",
        title: "Module 1 Quiz: SCM Fundamentals",
        activityType: "quiz",
        completed: true,
        data: {
          type: "quiz",
          passingScore: 70,
          questions: [
            {
              id: "l-q1",
              question: "Which of the following is NOT one of the five key components of Supply Chain Management?",
              type: "multiple-choice",
              options: [
                { id: "a", text: "Planning" },
                { id: "b", text: "Marketing" },
                { id: "c", text: "Sourcing" },
                { id: "d", text: "Manufacturing" },
              ],
              correctAnswerId: "b",
              explanation: "The five key components of SCM are Planning, Sourcing, Manufacturing, Delivery & Logistics, and Returns. Marketing is a separate business function.",
            },
            {
              id: "l-q2",
              question: "A just-in-time supply chain means retail sales automatically signal replenishment orders to manufacturers.",
              type: "true-false",
              options: [
                { id: "t", text: "True" },
                { id: "f", text: "False" },
              ],
              correctAnswerId: "t",
              explanation: "Just-in-time (JIT) supply chains are designed so that retail sales data triggers automatic replenishment orders, minimizing inventory holding costs.",
            },
            {
              id: "l-q3",
              question: "Which step in SCM is most focused on measuring quality levels and production output?",
              type: "multiple-choice",
              options: [
                { id: "a", text: "Planning" },
                { id: "b", text: "Sourcing" },
                { id: "c", text: "Manufacturing" },
                { id: "d", text: "Delivery" },
              ],
              correctAnswerId: "c",
              explanation: "Manufacturing is the step where companies focus most heavily on measuring quality levels, production output, and worker productivity.",
            },
          ],
        },
      },
    ],
  },
  {
    id: "l-m2",
    title: "Module 2: Transportation & Distribution Networks",
    description: "Understand modes of transport, route optimization, and how distribution networks are designed.",
    activities: [
      {
        id: "l-m2-a1",
        title: "Modes of Transportation",
        activityType: "video",
        completed: true,
        data: {
          type: "video",
          videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
          duration: "14:21",
        },
      },
      {
        id: "l-m2-a2",
        title: "Designing Distribution Networks",
        activityType: "reading",
        completed: true,
        data: {
          type: "reading",
          estimatedMinutes: 15,
          content: `## Designing Distribution Networks\n\nA distribution network is the interconnected group of storage facilities and transportation systems that receive inventories of goods and then deliver them to customers.\n\n### Network Design Considerations\n\n**Customer Service Requirements**\n- Delivery speed expectations\n- Order accuracy and completeness\n- Product availability levels\n\n**Cost Factors**\n- Transportation costs (inbound and outbound)\n- Warehousing costs (fixed and variable)\n- Inventory holding costs\n- Information system costs\n\n### Hub-and-Spoke vs Direct Shipping\n\nThe hub-and-spoke model consolidates freight at central hubs before distributing to final destinations. Direct shipping bypasses hubs entirely, shipping from source to destination.\n\nEach model has trade-offs in cost, speed, and flexibility that must be evaluated against customer requirements.\n\n### Key Metrics\n\n| Metric | Definition |\n|--------|------------|\n| Order Cycle Time | Time from order placement to delivery |\n| Fill Rate | Percentage of demand met from available stock |\n| Perfect Order Rate | Orders delivered on-time, in-full, damage-free |`,
        },
      },
      {
        id: "l-m2-a3",
        title: "Route Optimization Strategies",
        activityType: "video",
        completed: true,
        data: {
          type: "video",
          videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
          duration: "11:05",
        },
      },
      {
        id: "l-m2-a4",
        title: "Module 2 Quiz: Transport & Distribution",
        activityType: "quiz",
        completed: false,
        data: {
          type: "quiz",
          passingScore: 70,
          questions: [
            {
              id: "l-m2-q1",
              question: "What is the primary advantage of a hub-and-spoke distribution model?",
              type: "multiple-choice",
              options: [
                { id: "a", text: "Fastest delivery times" },
                { id: "b", text: "Freight consolidation and cost efficiency" },
                { id: "c", text: "No need for warehouses" },
                { id: "d", text: "Eliminates the need for tracking" },
              ],
              correctAnswerId: "b",
              explanation: "Hub-and-spoke models consolidate freight at central hubs, achieving economies of scale in transportation and reducing overall costs.",
            },
            {
              id: "l-m2-q2",
              question: "Fill Rate measures the percentage of demand met from available stock.",
              type: "true-false",
              options: [
                { id: "t", text: "True" },
                { id: "f", text: "False" },
              ],
              correctAnswerId: "t",
              explanation: "Fill rate is indeed the percentage of customer demand that is met directly from available inventory without backorders or lost sales.",
            },
          ],
        },
      },
    ],
  },
  {
    id: "l-m3",
    title: "Module 3: Inventory Management",
    description: "Master inventory control techniques, safety stock calculations, and demand forecasting.",
    activities: [
      {
        id: "l-m3-a1",
        title: "Inventory Control Methods",
        activityType: "video",
        completed: false,
        data: {
          type: "video",
          videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
          duration: "16:45",
        },
      },
      {
        id: "l-m3-a2",
        title: "Safety Stock & Reorder Points",
        activityType: "reading",
        completed: false,
        data: {
          type: "reading",
          estimatedMinutes: 18,
          content: `## Safety Stock & Reorder Points\n\nSafety stock is extra inventory held to guard against variability in demand and supply lead times. The reorder point (ROP) is the inventory level at which a new order should be placed.\n\n### Calculating Safety Stock\n\nThe basic safety stock formula considers:\n- Average demand during lead time\n- Demand variability (standard deviation)\n- Desired service level (z-score)\n\n**Formula:** Safety Stock = Z x \u03C3_dLT\n\nWhere:\n- Z = service level z-score (e.g., 1.65 for 95%)\n- \u03C3_dLT = standard deviation of demand during lead time\n\n### Reorder Point Formula\n\n**ROP = (Average Daily Demand x Lead Time) + Safety Stock**\n\n### ABC Analysis\n\nABC analysis categorizes inventory into three classes:\n- **A items**: 20% of items, 80% of value (tight control)\n- **B items**: 30% of items, 15% of value (moderate control)\n- **C items**: 50% of items, 5% of value (simple control)\n\nThis classification helps organizations focus their inventory management resources where they matter most.`,
        },
      },
      {
        id: "l-m3-a3",
        title: "Module 3 Quiz: Inventory Management",
        activityType: "quiz",
        completed: false,
        data: {
          type: "quiz",
          passingScore: 70,
          questions: [
            {
              id: "l-m3-q1",
              question: "In ABC Analysis, which category represents roughly 20% of items but 80% of total inventory value?",
              type: "multiple-choice",
              options: [
                { id: "a", text: "A items" },
                { id: "b", text: "B items" },
                { id: "c", text: "C items" },
                { id: "d", text: "D items" },
              ],
              correctAnswerId: "a",
              explanation: "A items represent about 20% of total items but account for approximately 80% of the total inventory value, requiring the tightest control.",
            },
            {
              id: "l-m3-q2",
              question: "Safety stock is extra inventory held to guard against variability in demand and supply lead times.",
              type: "true-false",
              options: [
                { id: "t", text: "True" },
                { id: "f", text: "False" },
              ],
              correctAnswerId: "t",
              explanation: "Safety stock serves as a buffer against uncertainty in both demand fluctuations and supplier lead time variability.",
            },
          ],
        },
      },
    ],
  },
]

const procurementModules: CourseModule[] = [
  {
    id: "p-m1",
    title: "Module 1: Strategic Sourcing Fundamentals",
    description: "Learn the core principles of strategic sourcing, supplier evaluation, and procurement strategy.",
    activities: [
      {
        id: "p-m1-a1",
        title: "Introduction to Strategic Sourcing",
        activityType: "video",
        completed: true,
        data: {
          type: "video",
          videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
          duration: "10:15",
        },
      },
      {
        id: "p-m1-a2",
        title: "The Procurement Process",
        activityType: "reading",
        completed: true,
        data: {
          type: "reading",
          estimatedMinutes: 14,
          content: `## The Procurement Process\n\nProcurement is the process of finding and agreeing to terms, and acquiring goods, services, or works from an external source.\n\n### The 7-Step Procurement Process\n\n1. **Need Recognition** - Identifying the need for a product or service\n2. **Specification Development** - Defining the requirements\n3. **Supplier Research** - Identifying potential suppliers\n4. **Request for Proposal (RFP)** - Soliciting bids\n5. **Evaluation & Selection** - Assessing proposals\n6. **Contract Negotiation** - Finalizing terms\n7. **Performance Management** - Monitoring supplier delivery\n\n### Make vs Buy Decision\n\nOrganizations must decide whether to produce goods/services in-house or purchase them externally. Factors include:\n- Core competency alignment\n- Cost comparison (total cost of ownership)\n- Capacity and capability\n- Quality control requirements\n- Supply market risk\n\n### Supplier Evaluation Criteria\n\n| Criterion | Weight | Description |\n|-----------|--------|-------------|\n| Quality | 30% | Product/service quality standards |\n| Cost | 25% | Total cost of ownership |\n| Delivery | 20% | On-time delivery performance |\n| Flexibility | 15% | Ability to adapt to changes |\n| Innovation | 10% | Continuous improvement capability |`,
        },
      },
      {
        id: "p-m1-a3",
        title: "Module 1 Quiz: Sourcing Fundamentals",
        activityType: "quiz",
        completed: false,
        data: {
          type: "quiz",
          passingScore: 70,
          questions: [
            {
              id: "p-q1",
              question: "How many steps are in the standard procurement process described in this module?",
              type: "multiple-choice",
              options: [
                { id: "a", text: "5" },
                { id: "b", text: "6" },
                { id: "c", text: "7" },
                { id: "d", text: "8" },
              ],
              correctAnswerId: "c",
              explanation: "The standard procurement process has 7 steps: Need Recognition, Specification Development, Supplier Research, RFP, Evaluation & Selection, Contract Negotiation, and Performance Management.",
            },
            {
              id: "p-q2",
              question: "Core competency alignment is NOT a factor in the Make vs Buy decision.",
              type: "true-false",
              options: [
                { id: "t", text: "True" },
                { id: "f", text: "False" },
              ],
              correctAnswerId: "f",
              explanation: "Core competency alignment is indeed a key factor in Make vs Buy decisions. Organizations should focus internal resources on activities that align with their core strengths.",
            },
          ],
        },
      },
    ],
  },
  {
    id: "p-m2",
    title: "Module 2: Contract Management & Negotiation",
    description: "Master contract types, negotiation tactics, and supplier relationship management.",
    activities: [
      {
        id: "p-m2-a1",
        title: "Types of Procurement Contracts",
        activityType: "video",
        completed: false,
        data: {
          type: "video",
          videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
          duration: "12:30",
        },
      },
      {
        id: "p-m2-a2",
        title: "Negotiation Strategies for Buyers",
        activityType: "reading",
        completed: false,
        data: {
          type: "reading",
          estimatedMinutes: 16,
          content: `## Negotiation Strategies for Buyers\n\nEffective negotiation is a critical skill in procurement. The goal is to reach agreements that create value for both parties while securing favorable terms for your organization.\n\n### BATNA: Your Greatest Leverage\n\n**Best Alternative to a Negotiated Agreement** (BATNA) represents your fallback option. A strong BATNA gives you the power to walk away.\n\n### Key Negotiation Tactics\n\n**1. Anchoring**\nSet the initial reference point in your favor. The first number mentioned often influences the final outcome.\n\n**2. Bundling**\nCombine multiple items or services to create package deals that benefit both parties.\n\n**3. Trade-offs**\nIdentify items of low cost to you but high value to the supplier, and vice versa.\n\n**4. Time Pressure**\nUnderstand and manage deadlines. Avoid showing urgency that could weaken your position.\n\n### Collaborative vs Competitive Negotiation\n\n- **Collaborative (Win-Win)**: Focus on expanding the pie. Best for long-term strategic relationships.\n- **Competitive (Win-Lose)**: Focus on claiming value. Used for one-time transactions or commodities.`,
        },
      },
      {
        id: "p-m2-a3",
        title: "Module 2 Quiz: Contracts & Negotiation",
        activityType: "quiz",
        completed: false,
        data: {
          type: "quiz",
          passingScore: 70,
          questions: [
            {
              id: "p-m2-q1",
              question: "What does BATNA stand for?",
              type: "multiple-choice",
              options: [
                { id: "a", text: "Best Agreement To Negotiate Always" },
                { id: "b", text: "Best Alternative to a Negotiated Agreement" },
                { id: "c", text: "Buyer Advantage Through Negotiation Analysis" },
                { id: "d", text: "Basic Approach to Negotiation Alignment" },
              ],
              correctAnswerId: "b",
              explanation: "BATNA stands for Best Alternative to a Negotiated Agreement. It represents your fallback if the current negotiation fails.",
            },
            {
              id: "p-m2-q2",
              question: "Collaborative negotiation is best suited for one-time commodity transactions.",
              type: "true-false",
              options: [
                { id: "t", text: "True" },
                { id: "f", text: "False" },
              ],
              correctAnswerId: "f",
              explanation: "Collaborative (win-win) negotiation is best suited for long-term strategic relationships. Competitive negotiation is more appropriate for one-time commodity transactions.",
            },
          ],
        },
      },
    ],
  },
]

const leanModules: CourseModule[] = [
  {
    id: "ls-m1",
    title: "Module 1: Introduction to Lean Six Sigma",
    description: "Understand the history, principles, and DMAIC methodology of Lean Six Sigma.",
    activities: [
      {
        id: "ls-m1-a1",
        title: "History of Lean and Six Sigma",
        activityType: "video",
        completed: true,
        data: {
          type: "video",
          videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
          duration: "9:48",
        },
      },
      {
        id: "ls-m1-a2",
        title: "The DMAIC Framework",
        activityType: "reading",
        completed: true,
        data: {
          type: "reading",
          estimatedMinutes: 20,
          content: `## The DMAIC Framework\n\nDMAIC is the core methodology of Six Sigma for improving existing processes. It stands for Define, Measure, Analyze, Improve, and Control.\n\n### Define Phase\nClearly articulate the business problem, goal, potential resources, project scope, and high-level project timeline. Tools: Project Charter, SIPOC Diagram, Voice of the Customer.\n\n### Measure Phase\nMeasure the current performance of the process. Collect data to quantify the problem. Tools: Process Maps, Data Collection Plans, Measurement System Analysis.\n\n### Analyze Phase\nIdentify the root causes of defects and variation. Validate root causes with data. Tools: Fishbone Diagrams, 5 Whys, Pareto Charts, Hypothesis Testing.\n\n### Improve Phase\nDevelop, pilot, and implement solutions that address root causes. Tools: Brainstorming, Design of Experiments, Poka-Yoke (Error Proofing).\n\n### Control Phase\nEnsure the gains are sustained over time. Implement control systems and document standard operating procedures. Tools: Control Charts, Standard Work, Training Plans.\n\n### Key Metrics\n\n- **Sigma Level**: Measures process capability (higher is better)\n- **DPMO**: Defects Per Million Opportunities\n- **Cp/Cpk**: Process capability indices\n- **Yield**: Percentage of defect-free output`,
        },
      },
      {
        id: "ls-m1-a3",
        title: "Module 1 Quiz: Lean Six Sigma Foundations",
        activityType: "quiz",
        completed: true,
        data: {
          type: "quiz",
          passingScore: 70,
          questions: [
            {
              id: "ls-q1",
              question: "What does the 'A' in DMAIC stand for?",
              type: "multiple-choice",
              options: [
                { id: "a", text: "Adjust" },
                { id: "b", text: "Analyze" },
                { id: "c", text: "Assess" },
                { id: "d", text: "Align" },
              ],
              correctAnswerId: "b",
              explanation: "DMAIC stands for Define, Measure, Analyze, Improve, Control. The Analyze phase focuses on identifying root causes of defects and variation.",
            },
            {
              id: "ls-q2",
              question: "DMAIC is used for designing entirely new processes from scratch.",
              type: "true-false",
              options: [
                { id: "t", text: "True" },
                { id: "f", text: "False" },
              ],
              correctAnswerId: "f",
              explanation: "DMAIC is used for improving existing processes. DMADV (Define, Measure, Analyze, Design, Verify) is the Six Sigma methodology for designing new processes.",
            },
          ],
        },
      },
    ],
  },
]

const warehousingModules: CourseModule[] = [
  {
    id: "w-m1",
    title: "Module 1: Warehouse Design & Layout",
    description: "Learn warehouse layout planning, storage systems, and space optimization techniques.",
    activities: [
      {
        id: "w-m1-a1",
        title: "Warehouse Design Principles",
        activityType: "video",
        completed: true,
        data: {
          type: "video",
          videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
          duration: "11:20",
        },
      },
      {
        id: "w-m1-a2",
        title: "Storage Systems & Racking",
        activityType: "reading",
        completed: true,
        data: {
          type: "reading",
          estimatedMinutes: 13,
          content: `## Storage Systems & Racking\n\nSelecting the right storage system is crucial for warehouse efficiency. The choice depends on product characteristics, throughput requirements, and available space.\n\n### Types of Racking Systems\n\n**Selective Racking**\nThe most common type. Provides direct access to every pallet. Best for operations with a large variety of SKUs.\n\n**Drive-In Racking**\nHigh-density storage where forklifts drive into the rack structure. LIFO (Last In, First Out) system. Ideal for large quantities of similar products.\n\n**Push-Back Racking**\nPallets are stored on nested carts that ride on inclined rails. LIFO system with better selectivity than drive-in.\n\n**Pallet Flow Racking**\nGravity-fed FIFO (First In, First Out) system. Ideal for perishable goods and high-throughput operations.\n\n### Key Performance Indicators\n\n- **Space Utilization**: Percentage of available space in use\n- **Picking Accuracy**: Correct items picked per total picks\n- **Dock-to-Stock Time**: Time from receiving to storage\n- **Orders per Hour**: Throughput rate of order fulfillment`,
        },
      },
      {
        id: "w-m1-a3",
        title: "Module 1 Quiz: Warehouse Fundamentals",
        activityType: "quiz",
        completed: false,
        data: {
          type: "quiz",
          passingScore: 70,
          questions: [
            {
              id: "w-q1",
              question: "Which racking system uses a FIFO (First In, First Out) approach?",
              type: "multiple-choice",
              options: [
                { id: "a", text: "Selective Racking" },
                { id: "b", text: "Drive-In Racking" },
                { id: "c", text: "Push-Back Racking" },
                { id: "d", text: "Pallet Flow Racking" },
              ],
              correctAnswerId: "d",
              explanation: "Pallet Flow Racking is a gravity-fed FIFO system where pallets loaded at the back flow to the front, ensuring first in is first out.",
            },
            {
              id: "w-q2",
              question: "Drive-in racking provides direct access to every pallet.",
              type: "true-false",
              options: [
                { id: "t", text: "True" },
                { id: "f", text: "False" },
              ],
              correctAnswerId: "f",
              explanation: "Selective racking provides direct access to every pallet. Drive-in racking is a high-density LIFO system where forklifts enter the rack structure.",
            },
          ],
        },
      },
    ],
  },
]

const lastMileModules: CourseModule[] = [
  {
    id: "lm-m1",
    title: "Module 1: Last-Mile Delivery Fundamentals",
    description: "Understand the challenges and strategies of last-mile logistics.",
    activities: [
      {
        id: "lm-m1-a1",
        title: "The Last-Mile Challenge",
        activityType: "video",
        completed: true,
        data: {
          type: "video",
          videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
          duration: "9:55",
        },
      },
      {
        id: "lm-m1-a2",
        title: "Last-Mile Delivery Models",
        activityType: "reading",
        completed: true,
        data: {
          type: "reading",
          estimatedMinutes: 11,
          content: `## Last-Mile Delivery Models\n\nThe last mile represents the final step of the delivery process -- from the distribution center to the customer's doorstep. Despite being the shortest distance, it is often the most expensive and complex part of the supply chain.\n\n### Common Models\n\n**Traditional Courier**\nDedicated delivery vehicles with fixed routes. Reliable but expensive per delivery.\n\n**Crowdsourced Delivery**\nGig economy drivers using their own vehicles. Flexible capacity but variable quality.\n\n**Locker Networks**\nSecure pickup locations where customers retrieve packages. Reduces failed deliveries.\n\n**Micro-Fulfillment Centers**\nSmall, urban warehouses positioned close to customers for rapid delivery.\n\n**Drone & Autonomous Vehicles**\nEmerging technologies for automated last-mile delivery. Regulatory challenges remain.\n\n### Cost Breakdown\n\nLast-mile delivery typically accounts for **53% of total shipping costs**. The primary cost drivers are:\n- Failed delivery attempts (re-delivery costs)\n- Low drop density (rural areas)\n- Narrow delivery time windows\n- Return logistics`,
        },
      },
      {
        id: "lm-m1-a3",
        title: "Module 1 Quiz: Last-Mile Basics",
        activityType: "quiz",
        completed: true,
        data: {
          type: "quiz",
          passingScore: 70,
          questions: [
            {
              id: "lm-q1",
              question: "What percentage of total shipping costs does last-mile delivery typically account for?",
              type: "multiple-choice",
              options: [
                { id: "a", text: "23%" },
                { id: "b", text: "38%" },
                { id: "c", text: "53%" },
                { id: "d", text: "67%" },
              ],
              correctAnswerId: "c",
              explanation: "Last-mile delivery typically accounts for 53% of total shipping costs, making it the most expensive leg of the journey.",
            },
            {
              id: "lm-q2",
              question: "Locker networks help reduce failed delivery attempts.",
              type: "true-false",
              options: [
                { id: "t", text: "True" },
                { id: "f", text: "False" },
              ],
              correctAnswerId: "t",
              explanation: "Locker networks are secure pickup locations where customers retrieve packages at their convenience, effectively eliminating failed deliveries.",
            },
          ],
        },
      },
    ],
  },
]

const analyticsModules: CourseModule[] = [
  {
    id: "a-m1",
    title: "Module 1: Introduction to Supply Chain Analytics",
    description: "Learn how data analytics and AI are transforming supply chain decision-making.",
    activities: [
      {
        id: "a-m1-a1",
        title: "The Analytics Revolution in Supply Chains",
        activityType: "video",
        completed: true,
        data: {
          type: "video",
          videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
          duration: "13:10",
        },
      },
      {
        id: "a-m1-a2",
        title: "Types of Supply Chain Analytics",
        activityType: "reading",
        completed: true,
        data: {
          type: "reading",
          estimatedMinutes: 15,
          content: `## Types of Supply Chain Analytics\n\nSupply chain analytics can be categorized into four types, each building on the previous level of sophistication.\n\n### 1. Descriptive Analytics\n*"What happened?"*\n\nUses historical data to understand past performance. Includes dashboards, reports, and KPI tracking.\n\n**Examples:**\n- Monthly shipping volume reports\n- Supplier performance scorecards\n- Inventory turnover analysis\n\n### 2. Diagnostic Analytics\n*"Why did it happen?"*\n\nDrills into data to understand the root causes of events. Uses correlation analysis, drill-down techniques, and data discovery.\n\n**Examples:**\n- Root cause analysis for delivery delays\n- Variance analysis in procurement spend\n\n### 3. Predictive Analytics\n*"What will happen?"*\n\nUses statistical models and machine learning to forecast future outcomes.\n\n**Examples:**\n- Demand forecasting\n- Predictive maintenance for fleet vehicles\n- Supplier risk scoring\n\n### 4. Prescriptive Analytics\n*"What should we do?"*\n\nRecommends optimal actions based on data. Uses optimization algorithms and simulation.\n\n**Examples:**\n- Optimal inventory levels\n- Best routing decisions\n- Dynamic pricing recommendations\n\n### The Role of AI\n\nArtificial Intelligence enhances all four analytics types through:\n- Natural Language Processing for unstructured data\n- Computer Vision for warehouse automation\n- Reinforcement Learning for dynamic optimization`,
        },
      },
      {
        id: "a-m1-a3",
        title: "Module 1 Quiz: Analytics Foundations",
        activityType: "quiz",
        completed: false,
        data: {
          type: "quiz",
          passingScore: 70,
          questions: [
            {
              id: "a-q1",
              question: "Which type of analytics answers the question 'What should we do?'",
              type: "multiple-choice",
              options: [
                { id: "a", text: "Descriptive" },
                { id: "b", text: "Diagnostic" },
                { id: "c", text: "Predictive" },
                { id: "d", text: "Prescriptive" },
              ],
              correctAnswerId: "d",
              explanation: "Prescriptive Analytics recommends optimal actions based on data analysis, answering 'What should we do?' using optimization and simulation.",
            },
            {
              id: "a-q2",
              question: "Demand forecasting is an example of descriptive analytics.",
              type: "true-false",
              options: [
                { id: "t", text: "True" },
                { id: "f", text: "False" },
              ],
              correctAnswerId: "f",
              explanation: "Demand forecasting is an example of predictive analytics, as it uses statistical models and machine learning to forecast future outcomes.",
            },
          ],
        },
      },
    ],
  },
]

/* ─── Course data ─── */

export const courses: Course[] = [
  {
    id: "1",
    title: "Supply Chain Logistics Fundamentals",
    instructor: "Dr. Sarah Chen",
    thumbnail: "/images/course-logistics.jpg",
    pillar: "Logistics",
    progress: 72,
    status: "in-progress",
    totalLessons: 24,
    completedLessons: 17,
    duration: "12 weeks",
    lastAccessed: "2 hours ago",
    description: "Master the core principles of supply chain logistics, including transportation networks, inventory management, and distribution strategies that drive global commerce.",
    modules: logisticsModules,
  },
  {
    id: "2",
    title: "Strategic Procurement & Sourcing",
    instructor: "Prof. James Okafor",
    thumbnail: "/images/course-procurement.jpg",
    pillar: "Procurement",
    progress: 45,
    status: "in-progress",
    totalLessons: 18,
    completedLessons: 8,
    duration: "8 weeks",
    lastAccessed: "1 day ago",
    description: "Develop expertise in strategic sourcing, supplier evaluation, contract negotiation, and procurement best practices for competitive advantage.",
    modules: procurementModules,
  },
  {
    id: "3",
    title: "Lean Six Sigma Green Belt",
    instructor: "Maria Rodriguez, MBB",
    thumbnail: "/images/course-lean.jpg",
    pillar: "Lean 6 Sigma",
    progress: 100,
    status: "completed",
    totalLessons: 30,
    completedLessons: 30,
    duration: "16 weeks",
    lastAccessed: "1 week ago",
    description: "Earn your Lean Six Sigma Green Belt by mastering the DMAIC methodology, statistical tools, and process improvement techniques.",
    modules: leanModules,
  },
  {
    id: "4",
    title: "Warehouse Management Systems",
    instructor: "David Kim, CSCP",
    thumbnail: "/images/course-warehousing.jpg",
    pillar: "Warehousing",
    progress: 20,
    status: "in-progress",
    totalLessons: 15,
    completedLessons: 3,
    duration: "6 weeks",
    lastAccessed: "3 days ago",
    description: "Learn warehouse design, layout optimization, storage systems, and modern WMS technology for efficient inventory operations.",
    modules: warehousingModules,
  },
  {
    id: "5",
    title: "Last-Mile Delivery Optimization",
    instructor: "Aisha Patel",
    thumbnail: "/images/course-lastmile.jpg",
    pillar: "Last-Mile",
    progress: 100,
    status: "completed",
    totalLessons: 12,
    completedLessons: 12,
    duration: "4 weeks",
    lastAccessed: "2 weeks ago",
    description: "Optimize last-mile delivery with cutting-edge models including crowdsourced delivery, micro-fulfillment centers, and route optimization algorithms.",
    modules: lastMileModules,
  },
  {
    id: "6",
    title: "Supply Chain Analytics & AI",
    instructor: "Dr. Wei Zhang",
    thumbnail: "/images/course-analytics.jpg",
    pillar: "Analytics",
    progress: 8,
    status: "in-progress",
    totalLessons: 20,
    completedLessons: 2,
    duration: "10 weeks",
    lastAccessed: "5 hours ago",
    description: "Harness the power of data analytics and artificial intelligence to transform supply chain decision-making, from demand forecasting to prescriptive optimization.",
    modules: analyticsModules,
  },
]

export const userProfile: UserProfile = {
  name: "Alex Nkomo",
  title: "Senior Supply Chain Analyst",
  email: "alex.nkomo@example.com",
  company: "GlobalTech Logistics",
  location: "Johannesburg, South Africa",
  avatarUrl: "",
  bio: "Experienced supply chain professional with 8+ years in logistics optimization and procurement strategy across Sub-Saharan Africa.",
  credentials: [
    {
      name: "APICS CPIM",
      issuer: "ASCM",
      dateEarned: "March 2023",
      status: "active",
    },
    {
      name: "CSCP",
      issuer: "ASCM",
      dateEarned: "November 2022",
      status: "active",
    },
    {
      name: "Lean Six Sigma Green Belt",
      issuer: "ASQ",
      dateEarned: "June 2024",
      status: "active",
    },
  ],
  milestones: [
    {
      title: "Enrolled in Nexus",
      date: "Jan 2022",
      completed: true,
    },
    {
      title: "First Course Completed",
      date: "Apr 2022",
      completed: true,
    },
    {
      title: "CSCP Certification",
      date: "Nov 2022",
      completed: true,
    },
    {
      title: "APICS CPIM Earned",
      date: "Mar 2023",
      completed: true,
    },
    {
      title: "5 Courses Completed",
      date: "Dec 2024",
      completed: false,
    },
    {
      title: "Supply Chain Leader",
      date: "Target 2025",
      completed: false,
    },
  ],
}

export function getCourseById(id: string): Course | undefined {
  return courses.find((c) => c.id === id)
}
