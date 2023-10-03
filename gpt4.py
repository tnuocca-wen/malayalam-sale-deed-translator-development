from langchain.prompts.few_shot import FewShotPromptTemplate
from langchain.prompts.prompt import PromptTemplate
from langchain.llms import OpenAI
from langchain.chains import LLMChain
from langchain.chat_models import ChatOpenAI

import ast

import re
import tiktoken

import csv

examples_list = None
def make_examples_list():
  global examples_list
  with open('examples.txt', 'r', encoding='utf8') as tpairs:
    examples_list = tpairs.read()

  examples_list = ast.literal_eval(examples_list)
  print(type(examples_list))
  # examples = [n.strip() for n in examples]

def num_tokens_from_string(string: str, encoding_name: str) -> int:
    """Returns the number of tokens in a text string."""
    encoding = tiktoken.get_encoding(encoding_name)
    # encoding = tiktoken.encoding_for_model("gpt-3.5-turbo")
    num_tokens = len(encoding.encode(string))
    return num_tokens


def tokenize(text):
    pattern = r'\b[\u0D00-\u0D7F]+'  # Unicode range for Malayalam characters
    return re.findall(pattern, text)
    # encoding = tiktoken.encoding_for_model("gpt-4")
    # return encoding.encode(text)


def calculate_similarity(sentence1, sentence2):
    # print(sentence1)
    tokens1 = set(tokenize(sentence1))
    tokens2 = set(tokenize(sentence2))
    # print("token 1", tokens1, end='\n')
    # print("token 2", tokens2, end='\n')
    common_tokens = tokens1.intersection(tokens2)
    return len(common_tokens)


def find_most_similar(sentences, input_sentence, num_results=3):
    similarities = []
    for entry in sentences:
        malayalam_sent = entry['malayalam_sent']
        translation = entry['translation']
        similarity = calculate_similarity(input_sentence, malayalam_sent) 
        if similarity > 0:  # Ignore entries with similarity 0
            similarities.append({'malayalam_sent': malayalam_sent, 'translation': translation})
        # if len(similarity) == len(tokens2) or len(similarity) > len(tokens2)/2:

    similarities.sort(key=lambda x: calculate_similarity(input_sentence, x['malayalam_sent']), reverse=True)
    
    return similarities[:num_results]


def example_select(sentence):
  # Example input list of dictionaries
  input_list = examples_list
  input_sentence = sentence
  
  # Find the three most similar dictionaries
  most_similar = find_most_similar(input_list, input_sentence, num_results=1)#int(len(examples_list)/2)

  # Print the results
  # for idx, entry in enumerate(most_similar, start=1):
    # print(f"Match {idx}:\nMalayalam Sentence: {entry['malayalam_sent']}\nTranslation: {entry['translation']}\n")
  
  return most_similar


def dictionary_search(input_sentence):
  dictionary = {}
  # Open the CSV file for reading
  with open('glossary.csv', mode='r', encoding='utf8') as file:
      # Create a CSV reader
      csv_reader = csv.reader(file)
      
      # Skip the header row (if it exists)
      next(csv_reader, None)
      
      # Iterate through the rows in the CSV file
      for row in csv_reader:
          # Assuming the first column is the key and the second column is the value
          key, value = row[0], row[1]
          
          # Add the key-value pair to the dictionary
          dictionary[key] = value
  
  # print(dictionary)
  tran_dict = []
  looked_words = []
  for word in tokenize(input_sentence):
    # print(word)
    for x in dictionary.keys():
      if word == x and word not in looked_words:
        tran_dict.append(f"'{x}' as '{dictionary[x]}'")
    looked_words.append(word)
  # print(tran_dict)
  return "\n".join(tran_dict)



def chatGPT_Trans(text):
  global examples_list
  make_examples_list()

  example_prompt = PromptTemplate(input_variables=["malayalam_sent", "translation"], template="Translate to English : {malayalam_sent}\n{translation}")

  llm = ChatOpenAI(model = 'gpt-4', temperature=0)

  dictionary = dictionary_search(text)

  prompt = FewShotPromptTemplate(
    examples = example_select(text),
    example_prompt=example_prompt,
    suffix='''You are an expert translator of legal documents and sale deeds from malayalam to english
     note to translate
     {dictionary}
     in the following: {input}''',
    input_variables=["input","dictionary"])
  
  comp_prompt = prompt.format(input=text,dictionary=dictionary)
  # print(type(comp_prompt))
  print(comp_prompt)
  print(num_tokens_from_string(comp_prompt, "cl100k_base"))
  
  chain = LLMChain(llm=llm, prompt=prompt)
  response = chain.run({"input":text, "dictionary":dictionary})
  return response