import openai

openai.api_key = "YOUR_OPENAI_API_KEY"

def generate_article_outline(topic, target_audience, tone):
    prompt = f"""Generate a detailed, SEO-friendly article outline for a blog post about '{topic}'.
    Target Audience: {target_audience}
    Tone: {tone}
    
    Include:
    - A compelling title (H1)
    - An engaging introduction
    - 3-5 main sections (H2) with 2-3 sub-sections (H3) each
    - A conclusion with a call to action
    - Suggested keywords to include naturally
    
    Format the output as a markdown outline.
    """
    
    response = openai.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "You are a helpful SEO content assistant."},
            {"role": "user", "content": prompt}
        ],
        max_tokens=500
    )
    return response.choices[0].message.content

# Example Usage:
# outline = generate_article_outline("Benefits of Cloud Computing for Startups", "Startup Founders", "Informative and encouraging")
# print(outline)

# Example Python code for generating a section of an article
def generate_article_section(topic, section_title, outline_context, tone):
    prompt = f"""Write a detailed and engaging section for an article about '{topic}'.
    Section Title: {section_title}
    Outline Context: {outline_context}
    Tone: {tone}
    
    Ensure the content is original, informative, and incorporates relevant keywords naturally.
    """
    
    response = openai.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "You are a helpful SEO content assistant."},
            {"role": "user", "content": prompt}
        ],
        max_tokens=1000
    )
    return response.choices[0].message.content

# Example Usage:
# section_content = generate_article_section("Benefits of Cloud Computing for Startups", "Scalability and Flexibility", "Under the 'Benefits' main section, discuss how cloud computing allows startups to scale resources up or down quickly and adapt to changing needs.", "Informative and encouraging")
# print(section_content)
