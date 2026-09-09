import logging
from sqlalchemy.orm import Session
from backend.app.models.subject import Subject
from backend.app.models.topic import Topic
from backend.app.models.prerequisite import Prerequisite

logger = logging.getLogger("learnloop.seed")

def seed_canonical_knowledge(db: Session):
    """Seed canonical Data Structures & Algorithms knowledge structure & prerequisites"""
    # Check if DSA subject already exists
    dsa_slug = "data-structures-and-algorithms"
    existing_subject = db.query(Subject).filter(Subject.slug == dsa_slug).first()
    if existing_subject:
        logger.info("Canonical subject 'Data Structures & Algorithms' already seeded.")
        return existing_subject

    logger.info("Seeding canonical subject and topic hierarchy for Data Structures & Algorithms...")
    subject = Subject(
        name="Data Structures & Algorithms",
        slug=dsa_slug,
        is_canonical=True
    )
    db.add(subject)
    db.flush()

    # Topic definitions (name, slug, difficulty, parent_slug)
    topic_defs = [
        # Linear
        ("Arrays", "arrays", "beginner", None),
        ("Linked Lists", "linked-lists", "beginner", None),
        ("Singly Linked Lists", "singly-linked-lists", "beginner", "linked-lists"),
        ("Doubly Linked Lists", "doubly-linked-lists", "beginner", "linked-lists"),
        ("Stacks", "stacks", "beginner", None),
        ("Queues", "queues", "beginner", None),
        
        # Trees
        ("Trees", "trees", "intermediate", None),
        ("Binary Trees", "binary-trees", "intermediate", "trees"),
        ("Binary Search Trees", "binary-search-trees", "intermediate", "trees"),
        ("AVL Trees", "avl-trees", "advanced", "trees"),
        ("Heaps & Priority Queues", "heaps", "intermediate", None),
        
        # Graphs
        ("Graphs", "graphs", "intermediate", None),
        ("Graph Representation", "graph-representation", "intermediate", "graphs"),
        ("Breadth-First Search (BFS)", "bfs", "intermediate", "graphs"),
        ("Depth-First Search (DFS)", "dfs", "intermediate", "graphs"),
        ("Dijkstra's Algorithm", "dijkstra", "advanced", "graphs"),
    ]

    topic_map = {}

    # First pass: create parent topics (where parent_slug is None)
    for name, slug, difficulty, parent_slug in topic_defs:
        if parent_slug is None:
            t = Topic(
                subject_id=subject.id,
                name=name,
                slug=slug,
                difficulty=difficulty,
                parent_topic_id=None,
                is_canonical=True
            )
            db.add(t)
            db.flush()
            topic_map[slug] = t

    # Second pass: create child topics
    for name, slug, difficulty, parent_slug in topic_defs:
        if parent_slug is not None:
            parent = topic_map.get(parent_slug)
            t = Topic(
                subject_id=subject.id,
                name=name,
                slug=slug,
                difficulty=difficulty,
                parent_topic_id=parent.id if parent else None,
                is_canonical=True
            )
            db.add(t)
            db.flush()
            topic_map[slug] = t

    # Prerequisite definitions: (topic_slug, prerequisite_slug)
    # i.e., to learn topic_slug, you must first know prerequisite_slug
    prereq_defs = [
        ("stacks", "arrays"),
        ("stacks", "linked-lists"),
        ("queues", "arrays"),
        ("queues", "linked-lists"),
        ("trees", "linked-lists"),
        ("binary-trees", "trees"),
        ("binary-search-trees", "binary-trees"),
        ("avl-trees", "binary-search-trees"),
        ("heaps", "binary-trees"),
        ("graphs", "trees"),
        ("graph-representation", "graphs"),
        ("bfs", "graph-representation"),
        ("bfs", "queues"),
        ("dfs", "graph-representation"),
        ("dfs", "stacks"),
        ("dijkstra", "graph-representation"),
        ("dijkstra", "heaps"),
    ]

    for topic_slug, prereq_slug in prereq_defs:
        topic = topic_map.get(topic_slug)
        prereq = topic_map.get(prereq_slug)
        if topic and prereq:
            p = Prerequisite(
                topic_id=topic.id,
                prerequisite_topic_id=prereq.id
            )
            db.add(p)

    db.commit()
    logger.info("Canonical knowledge base successfully seeded.")
    return subject
