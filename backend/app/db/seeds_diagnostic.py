import logging
from sqlalchemy.orm import Session
from backend.app.models.subject import Subject
from backend.app.models.topic import Topic
from backend.app.models.diagnostic import DiagnosticQuestion, DiagnosticOption

logger = logging.getLogger("learnloop.seed_diagnostic")

# High-quality academic conceptual questions covering canonical DSA topics
DIAGNOSTIC_QUESTION_BANK = [
    # --- Arrays ---
    {
        "topic_slug": "arrays",
        "question_text": "Why does retrieving an element by index in a contiguous array operate in O(1) constant time, whereas in a linked list it requires O(n) time?",
        "difficulty": "beginner",
        "explanation": "Arrays store elements in contiguous memory locations, allowing the CPU to compute the exact physical address in O(1) time via base_address + index * element_size. Linked lists require pointer chasing through nodes sequentially.",
        "options": [
            {"text": "Array elements are hashed by their index values directly into hardware registers.", "is_correct": False},
            {"text": "Memory addresses are contiguous, allowing direct arithmetic calculation of any element's location (base + index * size).", "is_correct": True},
            {"text": "Arrays use binary search trees internally to locate indices rapidly.", "is_correct": False},
            {"text": "Linked lists require rebalancing before every lookup operation.", "is_correct": False}
        ]
    },
    {
        "topic_slug": "arrays",
        "question_text": "What is the amortized time complexity of inserting n elements into a dynamic array that doubles its capacity whenever it fills up?",
        "difficulty": "intermediate",
        "explanation": "Although copying elements during resizing takes O(k) time occasionally, doubling capacity ensures that resizing occurs exponentially infrequently, resulting in O(1) amortized time per insertion.",
        "options": [
            {"text": "O(1) amortized time per insertion, though individual resizing insertions cost O(k).", "is_correct": True},
            {"text": "O(n) per insertion because elements must always be shifted.", "is_correct": False},
            {"text": "O(log n) because capacity increases logarithmically.", "is_correct": False},
            {"text": "O(n^2) due to the accumulated memory reallocations.", "is_correct": False}
        ]
    },

    # --- Linked Lists ---
    {
        "topic_slug": "linked-lists",
        "question_text": "Given a pointer directly to an arbitrary middle node in a singly linked list (without a pointer to the head or previous node), which of the following operations is possible in O(1) time?",
        "difficulty": "intermediate",
        "explanation": "You can delete the node in O(1) by copying the value of node.next into the current node and pointing node.next to node.next.next (assuming it is not the last node).",
        "options": [
            {"text": "Finding the predecessor node in O(1) time.", "is_correct": False},
            {"text": "Deleting the current node by copying the next node's value and bypassing the next node.", "is_correct": True},
            {"text": "Reversing the entire list up to this node in O(1) time.", "is_correct": False},
            {"text": "Directly accessing the median element in O(1) time.", "is_correct": False}
        ]
    },

    # --- Stacks ---
    {
        "topic_slug": "stacks",
        "question_text": "When evaluating an expression for balanced parentheses (e.g. '{[()]}'), what invariant justifies using a Stack data structure?",
        "difficulty": "beginner",
        "explanation": "A stack enforces Last-In, First-Out (LIFO) order, which matches the nesting structure of brackets: the most recently opened bracket must be the first one closed.",
        "options": [
            {"text": "The most recently opened bracket must be the first one closed (Last-In, First-Out).", "is_correct": True},
            {"text": "The oldest opened bracket has the highest evaluation priority.", "is_correct": False},
            {"text": "Stacks allow constant-time searching for matching closing tags.", "is_correct": False},
            {"text": "Bracket validation requires sorted order of ASCII character codes.", "is_correct": False}
        ]
    },

    # --- Queues ---
    {
        "topic_slug": "queues",
        "question_text": "Which property of a Queue makes it the necessary data structure for Breadth-First Search (BFS) on a graph?",
        "difficulty": "beginner",
        "explanation": "A Queue enforces First-In, First-Out (FIFO) processing, which guarantees that all vertices at distance d are visited and expanded before any vertex at distance d+1.",
        "options": [
            {"text": "FIFO ordering ensures vertices are explored in increasing order of their distance from the source.", "is_correct": True},
            {"text": "LIFO ordering prevents revisiting already visited cycle vertices.", "is_correct": False},
            {"text": "Queues allow backtracking along the longest path first.", "is_correct": False},
            {"text": "Queues automatically sort edges by their numerical weights.", "is_correct": False}
        ]
    },

    # --- Trees ---
    {
        "topic_slug": "trees",
        "question_text": "In a complete binary tree with N nodes, what is the exact height of the tree?",
        "difficulty": "beginner",
        "explanation": "A complete binary tree fills every level except possibly the last from left to right, maintaining a balanced logarithmic height of floor(log2(N)).",
        "options": [
            {"text": "floor(log2(N))", "is_correct": True},
            {"text": "O(N)", "is_correct": False},
            {"text": "N / 2", "is_correct": False},
            {"text": "2^N", "is_correct": False}
        ]
    },

    # --- Binary Trees ---
    {
        "topic_slug": "binary-trees",
        "question_text": "Which tree traversal order visits nodes in the sequence: Left Subtree -> Root Node -> Right Subtree?",
        "difficulty": "beginner",
        "explanation": "Inorder traversal visits the left subtree first, then processes the current root node, and finally traverses the right subtree.",
        "options": [
            {"text": "Preorder Traversal", "is_correct": False},
            {"text": "Inorder Traversal", "is_correct": True},
            {"text": "Postorder Traversal", "is_correct": False},
            {"text": "Level-order Traversal", "is_correct": False}
        ]
    },

    # --- Binary Search Trees (BST) ---
    {
        "topic_slug": "binary-search-trees",
        "question_text": "What happens to the search time complexity of a standard Binary Search Tree when keys are inserted in strictly ascending sorted order without balancing?",
        "difficulty": "intermediate",
        "explanation": "Inserting sorted keys into an unbalancing BST causes each new node to be inserted as the right child of the previous node, degenerating the tree into a linked list with O(N) search time.",
        "options": [
            {"text": "It remains O(log N) because binary search logic is preserved.", "is_correct": False},
            {"text": "It degrades to O(N) linear time because the tree degenerates into a singly linked list chain.", "is_correct": True},
            {"text": "It improves to O(1) time because the root element is known to be the minimum.", "is_correct": False},
            {"text": "It throws an insertion collision error.", "is_correct": False}
        ]
    },
    {
        "topic_slug": "binary-search-trees",
        "question_text": "An inorder traversal performed on a valid Binary Search Tree always produces:",
        "difficulty": "beginner",
        "explanation": "By the BST property (left < root < right), recursively traversing left, then root, then right produces elements in strictly ascending sorted order.",
        "options": [
            {"text": "Keys sorted in ascending numerical order.", "is_correct": True},
            {"text": "Keys sorted in descending numerical order.", "is_correct": False},
            {"text": "Nodes grouped by their tree depth levels.", "is_correct": False},
            {"text": "Leaves first followed by internal branching nodes.", "is_correct": False}
        ]
    },

    # --- AVL Trees ---
    {
        "topic_slug": "avl-trees",
        "question_text": "In an AVL tree, what is the valid range of balance factors (height(left) - height(right)) for every node in the tree?",
        "difficulty": "intermediate",
        "explanation": "An AVL tree is strictly height-balanced: for every node, the heights of its left and right subtrees can differ by at most 1, so the balance factor must be in {-1, 0, +1}.",
        "options": [
            {"text": "{-1, 0, +1}", "is_correct": True},
            {"text": "{0, 1, 2}", "is_correct": False},
            {"text": "{-2, 0, +2}", "is_correct": False},
            {"text": "Any value less than log2(N)", "is_correct": False}
        ]
    },
    {
        "topic_slug": "avl-trees",
        "question_text": "If a node in an AVL tree becomes unbalanced with balance factor +2 after an insertion into the right subtree of its left child (LR case), which rotation resolves it?",
        "difficulty": "advanced",
        "explanation": "A Left-Right (LR) imbalance is resolved by a double rotation: first a Left rotation on the left child, followed by a Right rotation on the unbalanced parent node.",
        "options": [
            {"text": "A single Left rotation.", "is_correct": False},
            {"text": "A double rotation: Left rotation on the left child, then Right rotation on the root.", "is_correct": True},
            {"text": "A single Right rotation.", "is_correct": False},
            {"text": "A double Right-Right rotation on the grandparent.", "is_correct": False}
        ]
    },

    # --- Heaps & Priority Queues ---
    {
        "topic_slug": "heaps",
        "question_text": "When building a binary min-heap from an unsorted array of N elements using the bottom-up 'heapify' algorithm (Floyd's algorithm), what is the overall time complexity?",
        "difficulty": "intermediate",
        "explanation": "Floyd's bottom-up heapify runs in O(N) linear time because the number of operations is bounded by sum(h * N / 2^(h+1)) = O(N), which is faster than N successive insertions (O(N log N)).",
        "options": [
            {"text": "O(N) linear time", "is_correct": True},
            {"text": "O(N log N) time", "is_correct": False},
            {"text": "O(N^2) quadratic time", "is_correct": False},
            {"text": "O(log N) logarithmic time", "is_correct": False}
        ]
    },

    # --- Graphs ---
    {
        "topic_slug": "graphs",
        "question_text": "For a sparse graph with V vertices and E edges (where E << V^2), why is an Adjacency List preferred over an Adjacency Matrix?",
        "difficulty": "beginner",
        "explanation": "An Adjacency Matrix always allocates O(V^2) space regardless of edges, whereas an Adjacency List requires only O(V + E) space and enables faster iteration over neighbors.",
        "options": [
            {"text": "Adjacency List requires O(V + E) space compared to O(V^2) for Adjacency Matrix.", "is_correct": True},
            {"text": "Adjacency List allows O(1) edge existence checks between any arbitrary pair of vertices.", "is_correct": False},
            {"text": "Adjacency Matrix cannot store directed graph edges.", "is_correct": False},
            {"text": "Adjacency List automatically detects cycles without graph traversal.", "is_correct": False}
        ]
    },

    # --- Graph Representation ---
    {
        "topic_slug": "graph-representation",
        "question_text": "What is the time complexity to iterate over all neighbors of vertex u in an Adjacency List representation of a graph?",
        "difficulty": "beginner",
        "explanation": "In an adjacency list, the neighbors of u are stored directly in u's linked list/array, so iterating over them takes O(deg(u)) time proportional to u's degree.",
        "options": [
            {"text": "O(deg(u)), proportional to the number of neighbors u has.", "is_correct": True},
            {"text": "O(V), because all vertices must be checked.", "is_correct": False},
            {"text": "O(1), using index arithmetic.", "is_correct": False},
            {"text": "O(E), scanning every edge in the entire graph.", "is_correct": False}
        ]
    },

    # --- Breadth-First Search (BFS) ---
    {
        "topic_slug": "bfs",
        "question_text": "Suppose BFS is executed on an unweighted graph starting from vertex S. When vertex V is popped from the queue, what does its recorded distance represent?",
        "difficulty": "intermediate",
        "explanation": "In an unweighted graph, BFS explores vertices in increasing order of distance (level-by-level), guaranteeing that the first time a vertex is reached, the path length is the minimum possible number of edges.",
        "options": [
            {"text": "The minimum number of edges on any path from S to V (shortest path in unweighted graph).", "is_correct": True},
            {"text": "The maximum bottleneck edge capacity between S and V.", "is_correct": False},
            {"text": "The total number of alternative paths between S and V.", "is_correct": False},
            {"text": "The topological discovery finish time of vertex V.", "is_correct": False}
        ]
    },

    # --- Depth-First Search (DFS) ---
    {
        "topic_slug": "dfs",
        "question_text": "How can Depth-First Search (DFS) be used to detect a cycle in a directed graph?",
        "difficulty": "intermediate",
        "explanation": "A directed graph contains a cycle if and only if DFS encounters a 'back-edge' pointing to an ancestor vertex that is currently on the active recursion stack (often marked with gray in 3-color marking).",
        "options": [
            {"text": "By encountering an edge pointing to a vertex currently in the active recursion call stack (a back-edge).", "is_correct": True},
            {"text": "By counting if the total number of visited vertices exceeds V / 2.", "is_correct": False},
            {"text": "By checking if any vertex has an out-degree equal to zero.", "is_correct": False},
            {"text": "By verifying if the queue size becomes empty before all nodes are explored.", "is_correct": False}
        ]
    },

    # --- Dijkstra's Algorithm ---
    {
        "topic_slug": "dijkstra",
        "question_text": "Why does standard Dijkstra's Algorithm fail to produce correct shortest paths on graphs containing negative edge weights?",
        "difficulty": "advanced",
        "explanation": "Dijkstra is a greedy algorithm that finalizes the shortest distance to a vertex the moment it is extracted from the priority queue, assuming no future path can reduce it. A negative edge later in the graph invalidates this greedy assumption.",
        "options": [
            {"text": "The greedy choice assumes that once a vertex is finalized from the priority queue, its distance cannot decrease, which is violated by negative edges.", "is_correct": True},
            {"text": "The priority queue throws an arithmetic underflow error when given negative numbers.", "is_correct": False},
            {"text": "Dijkstra's algorithm only operates on directed acyclic graphs (DAGs).", "is_correct": False},
            {"text": "Negative weights cause BFS to enter an infinite loop.", "is_correct": False}
        ]
    },
    {
        "topic_slug": "dijkstra",
        "question_text": "Using an adjacency list and a binary min-heap priority queue, what is the running time of Dijkstra's Algorithm for a graph with V vertices and E edges?",
        "difficulty": "intermediate",
        "explanation": "Each vertex is extracted from the heap once (V * log V) and each edge may trigger a priority decrease in the heap (E * log V), yielding O((V + E) log V).",
        "options": [
            {"text": "O((V + E) log V)", "is_correct": True},
            {"text": "O(V^2)", "is_correct": False},
            {"text": "O(V * E)", "is_correct": False},
            {"text": "O(V + E)", "is_correct": False}
        ]
    }
]

def seed_diagnostic_questions(db: Session):
    """Seed high-quality academic diagnostic questions mapped to canonical topics."""
    # Check if questions already exist
    existing_count = db.query(DiagnosticQuestion).count()
    if existing_count >= len(DIAGNOSTIC_QUESTION_BANK):
        logger.info(f"Diagnostic questions already seeded ({existing_count} questions present).")
        return

    logger.info("Seeding diagnostic questions and options...")
    
    # Map topics by slug
    topics = db.query(Topic).all()
    topic_map = {t.slug: t for t in topics}

    added_count = 0
    for q_data in DIAGNOSTIC_QUESTION_BANK:
        slug = q_data["topic_slug"]
        topic = topic_map.get(slug)
        if not topic:
            # Substring match if slug varies slightly
            for t in topics:
                if slug in t.slug or t.slug in slug:
                    topic = t
                    break
        
        if not topic:
            logger.warning(f"Could not find topic for slug '{slug}' while seeding question.")
            continue

        # Check if question text already exists
        existing_q = db.query(DiagnosticQuestion).filter(
            DiagnosticQuestion.topic_id == topic.id,
            DiagnosticQuestion.question_text == q_data["question_text"]
        ).first()

        if existing_q:
            continue

        question = DiagnosticQuestion(
            topic_id=topic.id,
            question_text=q_data["question_text"],
            difficulty=q_data["difficulty"],
            explanation=q_data.get("explanation"),
            is_active=True
        )
        db.add(question)
        db.flush()

        for idx, opt_data in enumerate(q_data["options"]):
            option = DiagnosticOption(
                question_id=question.id,
                option_text=opt_data["text"],
                order_index=idx,
                is_correct=opt_data["is_correct"]
            )
            db.add(option)

        added_count += 1

    db.commit()
    logger.info(f"Successfully seeded {added_count} diagnostic questions.")
