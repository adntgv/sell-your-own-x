import os
from flask import Flask, request, jsonify
from openai import OpenAI

app = Flask(__name__)

# Initialize OpenAI client
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

@app.route('/generate-outline', methods=['POST'])
def generate_outline():
    data = request.json
    topic = data.get('topic')
    target_audience = data.get('target_audience')
    tone = data.get('tone')

    if not all([topic, target_audience, tone]):
        return jsonify({'error': 'Missing parameters'}), 400

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
    
    try:
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a helpful SEO content assistant."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=500
        )
        return jsonify({'outline': response.choices[0].message.content})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/generate-section', methods=['POST'])
def generate_section():
    data = request.json
    topic = data.get('topic')
    section_title = data.get('section_title')
    outline_context = data.get('outline_context')
    tone = data.get('tone')

    if not all([topic, section_title, outline_context, tone]):
        return jsonify({'error': 'Missing parameters'}), 400

    prompt = f"""Write a detailed and engaging section for an article about '{topic}'.
    Section Title: {section_title}
    Outline Context: {outline_context}
    Tone: {tone}
    
    Ensure the content is original, informative, and incorporates relevant keywords naturally.
    """
    
    try:
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a helpful SEO content assistant."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=1000
        )
        return jsonify({'content': response.choices[0].message.content})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3000)
