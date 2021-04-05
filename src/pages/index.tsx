import { useState } from 'react'
import { GetStaticProps } from 'next';
import Link from 'next/link'

import { getPrismicClient } from '../services/prismic';
import Prismic from '@prismicio/client';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { FiCalendar, FiUser } from 'react-icons/fi'

import Head from 'next/head'

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  const [posts, setPosts] = useState<PostPagination>(postsPagination)

  async function handleLoadMorePosts() {
    try {
      const response = await fetch(postsPagination.next_page)
      const { results, next_page } = await response.json()

      const data = results.map((post: Post) => ({
        uid: post.uid,
        first_publication_date: post.first_publication_date,
        data: {
          title: post.data.title,
          subtitle: post.data.subtitle,
          author: post.data.author,
        },
      }));

      setPosts(state => {
        return {
          results: [...state.results, ...data],
          next_page
        }
      })
    } catch (err) {
      console.log(err)
    }
  }

  return (
    <>
      <Head>
        <title>Home | spacenews</title>
      </Head>

      <main className={styles.container}>
        <img src="/spacelogo.svg" alt="logo" />
        {posts?.results.map(post => (
          <section key={post.uid}>
            <Link href={`/post/${post.uid}`}>
              <h1>{post.data.title}</h1>
            </Link>
            <p>{post.data.subtitle}</p>

            <div>
              <time>
                <FiCalendar style={{ fontSize: "1.125rem", marginRight: "0.5rem" }} />
                {format(
                  new Date(post.first_publication_date),
                  "dd MMM yyy",
                  { locale: ptBR }
                )}
              </time>
              <p>
                <FiUser style={{ fontSize: "1.125rem", marginRight: "0.5rem" }} />
                {post.data.author}
              </p>
            </div>
          </section>
        ))}

        {posts?.next_page && <button onClick={handleLoadMorePosts}>Carregar mais posts</button>}
      </main>
    </>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query([
    Prismic.predicates.at("document.type", "posts")
  ], {
    fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
    pageSize: 1
  })

  const results = postsResponse.results.map((post: Post) => ({
    uid: post.uid,
    first_publication_date: post.first_publication_date,
    data: {
      title: post.data.title,
      subtitle: post.data.subtitle,
      author: post.data.author,
    },
  }));

  return {
    props: {
      postsPagination: {
        results,
        next_page: postsResponse.next_page
      }
    }
  }
};
