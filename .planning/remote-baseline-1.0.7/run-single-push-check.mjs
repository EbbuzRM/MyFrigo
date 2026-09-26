import assert from 'node:assert/strict';

const token = process.env.SUPABASE_ACCESS_TOKEN;
if (!token) throw new Error('SUPABASE_ACCESS_TOKEN is required');

const projectRef = 'tfhjupcybietwzmnpwfh';
const testProductId = 'myfrigo-release-107-push-check-20260924';
const cronCommandMd5 = '251fff804cebdec6e742458b4d005172';

async function query(sql) {
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
      signal: AbortSignal.timeout(15000),
    },
  );
  const body = await response.json();
  if (!response.ok) {
    throw new Error(`Database query failed: ${JSON.stringify(body).slice(0, 400)}`);
  }
  return Array.isArray(body) ? body : body.value;
}

async function main() {
  const escapedId = testProductId.replaceAll("'", "''");
  try {
    const [preflight] = await query(`
      SELECT count(*) AS products, count(DISTINCT e.user_id) AS users,
        count(p.subscription_id) AS registered_subscriptions
      FROM public.get_expiring_products() e
      LEFT JOIN public.user_push_subscriptions p ON p.user_id=e.user_id
    `);
    assert.equal(Number(preflight.products), 1);
    assert.equal(Number(preflight.users), 1);
    assert.equal(Number(preflight.registered_subscriptions), 1);
    const [target] = await query(`
      SELECT count(*) AS n FROM public.get_expiring_products()
      WHERE product_id='${escapedId}'
    `);
    assert.equal(Number(target.n), 1);

    const [triggered] = await query(`
      DO $push_test$
      DECLARE job_command text; http_request_id bigint;
      BEGIN
        SELECT command INTO job_command FROM cron.job
        WHERE jobname='send-expiration-notifications' AND active;
        IF job_command IS NULL OR md5(job_command) <> '${cronCommandMd5}' THEN
          RAISE EXCEPTION 'Push cron command changed since baseline';
        END IF;
        EXECUTE job_command INTO http_request_id;
        PERFORM set_config('myfrigo.push_test_request_id', http_request_id::text, false);
      END
      $push_test$;
      SELECT current_setting('myfrigo.push_test_request_id', true) AS request_id;
    `);
    const requestId = Number(triggered.request_id);
    assert.ok(Number.isSafeInteger(requestId) && requestId > 0);
    console.log(`Cron HTTP request queued: ${requestId}`);

    let response;
    for (let attempt = 0; attempt < 30; attempt += 1) {
      const records = await query(`
        SELECT status_code, content, timed_out, error_msg
        FROM net._http_response WHERE id=${requestId}
      `);
      if (records.length > 0) {
        response = records[0];
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    assert.ok(response, 'No pg_net HTTP response within 30 seconds');
    console.log(`Edge HTTP status: ${response.status_code}`);
    assert.equal(response.timed_out, false);
    assert.equal(response.error_msg, null);
    assert.equal(response.status_code, 200);
    const body = JSON.parse(response.content);
    console.log(`Products processed: ${body.productsProcessed}; users notified: ${body.usersNotified}`);
    assert.equal(body.productsProcessed, 1);
    assert.equal(body.usersNotified, 1);
  } finally {
    const deleted = await query(`
      DELETE FROM public.products WHERE id='${escapedId}' RETURNING id
    `);
    assert.equal(deleted.length, 1, 'Temporary push product cleanup failed');
    console.log('Temporary push product removed');
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
