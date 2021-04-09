import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head'

import { getPrismicClient } from '../../services/prismic';
import Prismic from '@prismicio/client'
import { RichText } from 'prismic-dom'

import styles from './post.module.scss';

import { format } from 'date-fns'
import ptBR from 'date-fns/locale/pt-BR'

import Header from '../../components/Header'

import { useRouter } from 'next/router'

import { FiUser, FiCalendar, FiClock } from 'react-icons/fi'
import { useEffect } from 'react';
import Link from 'next/link';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  last_publication_date: string | null;
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
  prevPost: Post | null;
  nextPost: Post | null
  preview: boolean;
}

export default function Post({ post, preview, prevPost, nextPost }: PostProps) {
  const { isFallback } = useRouter()

  if (isFallback) {
    return "Carregando..."
  }

  const postToText = post.data.content.map(content => {
    return content.body.map(body => body.text).join(" ")
  }).join(" ")

  const words = postToText.split(" ").length

  const readingTime = Math.ceil(words / 200)

  useEffect(() => {
    let script = document.createElement("script");
    let anchor = document.getElementById("inject-comments-for-uterances");
    script.setAttribute("src", "https://utteranc.es/client.js");
    script.setAttribute("crossorigin", "anonymous");
    script.setAttribute("async", "true");
    script.setAttribute("repo", "Gabriel2233/ignite-react-blog-comments");
    script.setAttribute("issue-term", "pathname");
    script.setAttribute("theme", "github-dark");
    anchor.appendChild(script);
  }, [])

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
              {post.first_publication_date && format(
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
          <span>
            {post.last_publication_date && format(
              new Date(post.last_publication_date),
              "'* editado em' dd MMM yyyy', às' HH:mm",
              {
                locale: ptBR,
              }
            )}
          </span>
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

        <hr />

        <section className={styles.navigation}>
          {prevPost ? (
            <div>
              <h3>{prevPost.data.title}</h3>
              <Link href={`/post/${prevPost.uid}`}>
                <a>Post Anterior</a>
              </Link>
            </div>
          ) : <div />}

          {nextPost ? (
            <div>
              <h3>{nextPost.data.title}</h3>
              <Link href={`/post/${nextPost.uid}`}>
                <a>Post Seguinte</a>
              </Link>
            </div>
          ) : <div />}
        </section>

        <div id="inject-comments-for-uterances"></div>
      </main>

      {preview && (
        <aside>
          <Link href="/api/exit-preview">
            <a>Sair do modo Preview</a>
          </Link>
        </aside>
      )}
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

export const getStaticProps: GetStaticProps = async ({ params, preview = false, previewData }) => {
  const prismic = getPrismicClient();
  const post = await prismic.getByUID("posts", String(params.slug), {
    ref: previewData?.ref ?? null
  });

  const prevPost =
    (
      await prismic.query([Prismic.predicates.at('document.type', 'posts')], {
        fetch: ['post.title'],
        pageSize: 1,
        after: post.id,
        orderings: '[document.first_publication_date]',
      })
    ).results[0] || null;

  const nextPost =
    (
      await prismic.query([Prismic.predicates.at('document.type', 'posts')], {
        fetch: ['post.title'],
        pageSize: 1,
        after: post.id,
        orderings: '[document.first_publication_date desc]',
      })
    ).results[0] || null;

  return {
    props: { post, nextPost, prevPost, preview }
  }
};
