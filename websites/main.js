const getPageVisitCount = async () => {
  // TODO: implement, call lambda function to get the page visit count
  const url = 'https://some-url.from.amazon.com';
  const response = await fetch(url);
  const data = await response.json();

  return data.pageVisitCount;
};
