const DUCKDUCKGO_RESULT_HTML = `
<html>
  <body>
    <div class="results">
      <div class="result">
        <a class="result__a" href="https://duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.com%2Ffirst">First Result</a>
        <a class="result__snippet">First snippet text</a>
      </div>
      <div class="result">
        <a class="result__a" href="https://example.com/second">Second Result</a>
        <div class="result__snippet">Second snippet text</div>
      </div>
      <div class="result">
        <a class="result__a" href="https://example.com/third">Third Result</a>
        <a class="result__snippet">Third snippet text</a>
      </div>
    </div>
  </body>
</html>
`;

export const createDuckDuckGoSearchResponse = (): Response =>
  new Response(DUCKDUCKGO_RESULT_HTML, {
    status: 200,
    headers: { 'Content-Type': 'text/html' },
  });
