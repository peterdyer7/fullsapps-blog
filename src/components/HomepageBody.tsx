import React from 'react';
import { Link } from '@docusaurus/router';
import styles from './HomepageBody.module.css';

export default function HomepageBody() {
  return (
    <section>
      <div className='container'>
        <div className='row'>
          <div className={styles.buttons}>
            <Link className='button button--secondary button--lg' to='/blog/archive'>
              Blog Archive
            </Link>

            <Link className='button button--secondary button--lg' to='/blog/tags'>
              Blog Tags
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
