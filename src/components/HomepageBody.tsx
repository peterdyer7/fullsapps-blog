import React from 'react';
import clsx from 'clsx';
import styles from './HomepageBody.module.css';

export default function HomepageBody() {
  return (
    <section>
      <div className={styles.features}>
        <div className='container'>
          <div className='row'>
            <div className={clsx('col col--4', styles.feature)}>
              <h2>What?</h2>
              <p>
                FullsApps is a collection of blog posts, links to code and videos that relate, in some way, to building
                fullstack applications with a focus on serverless, or cloud native, back-ends and React, web and native,
                front-ends.
              </p>
            </div>
            <div className={clsx('col col--4', styles.feature)}>
              <h2>Why?</h2>
              <p>Talking about things makes them real and encourages discussion. Discussion leads to cleaner ideas.</p>
            </div>
            <div className={clsx('col col--4', styles.feature)}>
              <h2>Who?</h2>
              <p>Peter, a guy who has been "doing" software for a long time.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
