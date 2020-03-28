(ns jarvis.com.client
  (:require [net.tcp.server :as s]
            [jarvis.com.server :refer [read-port]])
  (:import [java.net Socket]))

(defn print-handler
  [content reader writer]
  (.append writer "Hello my friend\nThis is a nice day\n")
  (.append writer content)
  (.append writer "\n")
  (.flush writer)
  (loop []
    (when-not (.ready reader)
      (Thread/sleep 10)
      (recur)))
  (loop []
    (when (.ready reader)
      (println (str "< " (.readLine reader)))))
  (println "-- end --"))

(defn send-msg
  ([content]
   (send-msg (read-port) content))
  ([port content]
   (with-open [socket (Socket. "localhost" port)]
     (let [handler (s/wrap-io (partial print-handler content))]
       (handler socket)))))

(comment
  (def content "test")
  (def port (read-port))

  ;; (with-open [s (Socket. "localhost" (read-port))]
  ;;   (.write (.getOutputStream s) (.getBytes "multi\nlines\n"))
  ;;   (loop []
  ;;     (when-not (.ready )))
  ;;   (println "< reading")
  ;;   (let [in (io/reader (.getInputStream s))]
  ;;     (loop []
  ;;       (println (str "< " (.readLine in)))
  ;;       (Thread/sleep 50)))
  ;;   ;;   (loop [ready (.ready in) c 0]
  ;;   ;;     (when (< c 10)
  ;;   ;;       (if ready
  ;;   ;;         (println (str "< " (.readLine in)))
  ;;   ;;         (do 
  ;;   ;;           (println "< nothing...")
  ;;   ;;           (Thread/sleep 10)
  ;;   ;;           (recur (.ready in) (inc c)))))))
  ;;   ;; (.write (.getOutputStream s) (.getBytes "adios\n"))
  ;;   (println "-- end --"))
  
  (send-msg "this is my content")
  
  )

