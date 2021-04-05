import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head'

import { getPrismicClient } from '../../services/prismic';
import Prismic from '@prismicio/client'
import { RichText } from 'prismic-dom'

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

import { format } from 'date-fns'
import ptBR from 'date-fns/locale/pt-BR'

import Header from '../../components/Header'

import { useRouter } from 'next/router'

import { FiUser, FiCalendar, FiClock } from 'react-icons/fi'

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {

  const { isFallback } = useRouter()

  if (isFallback) {
    return "Carregando..."
  }

  const postToText = post.data.content.map(content => {
    return content.body.map(body => body.text).join(" ")
  }).join(" ")

  const words = postToText.split(" ").length

  const readingTime = Math.ceil(words / 200)

  return (
    <>
      <Head>
        <title>{post.data.title} | spacenews</title>
      </Head>

      <Header />
      <div className={styles.banner}>
        <img src={post.data.banner.url} alt="Post banner" />
      </div>

      <main className={styles.container}>

        <div className={styles.title}>
          <h1>{post.data.title}</h1>

          <div>
            <p>
              <FiCalendar style={{ fontSize: "1.125rem", marginRight: "0.5rem" }} />
              {format(
                new Date(post.first_publication_date),
                "dd MMM yyyy",
                { locale: ptBR }
              )}
            </p>
            <p>
              <FiUser style={{ fontSize: "1.125rem", marginRight: "0.5rem" }} />
              {post.data.author}
            </p>
            <p>
              <FiClock style={{ fontSize: "1.125rem", marginRight: "0.5rem" }} />
              {readingTime} min
            </p>
          </div>
        </div>

        {post.data.content.map(section => {
          const html = RichText.asHtml(section.body)

          return (
            <section key={section.heading}>
              <h2>{section.heading}</h2>
              <div dangerouslySetInnerHTML={{ __html: html }} />
            </section>
          )
        })}
      </main>
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query([
    Prismic.predicates.at("document.type", "posts")
  ], {
    fetch: "posts.slug"
  });

  const paths = posts.results.map(post => {
    return {
      params: {
        slug: post.uid
      }
    }
  })

  return {
    paths,
    fallback: true
  }
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const prismic = getPrismicClient();
  const post = await prismic.getByUID("posts", String(params.slug), {});

  return {
    props: { post }
  }
};
